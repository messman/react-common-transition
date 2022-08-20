import * as React from 'react';
import { useTestButtons, wrap } from '@/test/decorate';
import { createClassSelectors } from './transition';
import { styled } from '@/test/styled';
import { SwitchTransition, SwitchTransitionTiming } from './switch-transition';

export default wrap(() => {
	const [isFirst, setIsFirst] = React.useState(true);

	const buttonsRender = useTestButtons({
		'Swap': () => {
			setIsFirst(p => !p);
		}
	});

	let render = isFirst ? (
		<ChildContainer $color='lightgreen'>
			<div>
				<p>First</p>
			</div>
		</ChildContainer>
	) : (
		<ChildContainer $color='lightblue'>
			<div>
				<p>Second</p>
			</div>
		</ChildContainer>
	);

	return (
		<>
			{buttonsRender}
			<TopContainer>
				<SwitchTransition
					transitionKey={isFirst ? 'first' : 'second'}
					timing={SwitchTransitionTiming.exitFirst}
				>
					<TransitionContainer>
						{render}
					</TransitionContainer>
				</SwitchTransition>
			</TopContainer>
		</>
	);
});

const TransitionSelectors = createClassSelectors({ useAmpersandPrefix: true });

const TopContainer = styled.div`
	width: 20rem;
	height: 20rem;
	box-sizing: border-box;
	border: 2px solid black;
	position: relative;
	overflow: hidden;
`;

const TransitionContainer = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	width: 100%;
	
	display: flex;
	align-items: stretch;
	justify-content: stretch;
	overflow: hidden;

	will-change: transform;

	${TransitionSelectors.inactive} {
		transform: translateY(100%);
	}
	${TransitionSelectors.active} {
		transform: translateY(0%);
	}
	${TransitionSelectors.transitioning} {
		transition: transform .2s ease-in-out;
	}
`;

const ChildContainer = styled.div<{ $color: string; }>`
	flex: 1;

	display: flex;
	justify-content: center;
	align-items: center;

	font-weight: bold;
	font-size: 2rem;
	background-color: ${p => p.$color};
	margin: 1rem;
	margin-bottom: 0;
	border-top-left-radius: 1rem;
	border-top-right-radius: 1rem;
`;
