import * as React from 'react';
import { useTestButtons, wrap } from '@/test/decorate';
import { createClassSelectors } from './transition';
import { styled } from '@/test/styled';
import { SwitchTransition } from './switch-transition';

export default wrap(() => {
	const [index, setIndex] = React.useState(0);

	const buttonsRender = useTestButtons({
		'Next': () => {
			setIndex(p => (p + 1) % 3);
		}
	});

	let render: JSX.Element = null!;

	if (index === 0) {
		render = (
			<InnerSlideContainer $color='lightgreen'>
				<div>
					<p>Page A</p>
				</div>
			</InnerSlideContainer>
		);
	}
	else if (index === 1) {
		render = (
			<InnerSlideContainer $color='lightblue'>
				<div>
					<p>Page B</p>
					<p>Page B</p>
				</div>
			</InnerSlideContainer>
		);
	}
	else if (index === 2) {
		render = (
			<InnerSlideContainer $color='pink'>
				<div>
					<p>Page C</p>
					<p>Page C</p>
					<p>Page C</p>
				</div>
			</InnerSlideContainer>
		);
	}
	return (
		<>
			{buttonsRender}
			<SlideTopContainer>
				<SwitchTransition transitionKey={index}>
					<SlideTransitionContainer>
						{render}
					</SlideTransitionContainer>
				</SwitchTransition>
			</SlideTopContainer>
		</>
	);
});

const TransitionSelectors = createClassSelectors({ useAmpersandPrefix: true });

const SlideTopContainer = styled.div`
	width: 25rem;
	height: 50rem;
	box-sizing: border-box;
	padding: 1rem;
	border: 2px solid black;
	position: relative;
	overflow: hidden;
`;

const slideTime = '.4s';

const SlideTransitionContainer = styled.div`
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

	${TransitionSelectors.transitioning} {
		transition: transform ${slideTime} ease-in-out;
	}
	${TransitionSelectors.active} {
		z-index: 1;
		transform: translateX(0);
	}
	${TransitionSelectors.inactive} {
		z-index: 0;
		transform: translateX(-30%);
	}
	${TransitionSelectors.enterStart} {
		z-index: 1;
		transform: translateX(100%);
	}
`;

const InnerSlideContainer = styled.div<{ $color: string; }>`
	flex: 1;

	display: flex;
	justify-content: center;
	align-items: center;

	font-weight: bold;
	font-size: 2rem;
	background-color: ${p => p.$color};
`;
