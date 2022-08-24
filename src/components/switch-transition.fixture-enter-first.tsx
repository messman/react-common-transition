import * as React from 'react';
import { useTestButtons, wrap } from '@/test/decorate';
import { styled } from '@/test/styled';
import { SwitchTransition, SwitchTransitionTiming } from './switch-transition';
import { createClassSelectors } from './transition';

export default wrap(() => {
	const [isFirst, setIsFirst] = React.useState(true);

	const buttonsRender = useTestButtons({
		'Swap': () => {
			setIsFirst(p => !p);
		}
	});

	let render = isFirst ? (
		<TransitionContainer $color='lightgreen'>
			<div>
				<p>First</p>
			</div>
		</TransitionContainer>
	) : (
		<TransitionContainer $color='lightblue'>
			<div>
				<p>Second</p>
			</div>
		</TransitionContainer>
	);

	return (
		<>
			{buttonsRender}
			<TopContainer>
				<SwitchTransition
					transitionKey={isFirst}
					timing={SwitchTransitionTiming.enterFirst}
				>
					{render}
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
	display: flex;
	align-items: stretch;
	justify-content: stretch;
	overflow: hidden;
`;

const TransitionContainer = styled.div<{ $color: string; }>`
	
	overflow: hidden;
	font-weight: bold;
	font-size: 2rem;
	background-color: ${p => p.$color};
	text-align: center;

	will-change: transform;

	${TransitionSelectors.inactive} {
		flex: 0;
	}
	${TransitionSelectors.active} {
		flex: 1;
	}
	${TransitionSelectors.transitioning} {
		transition: flex .5s ease;
	}
`;
