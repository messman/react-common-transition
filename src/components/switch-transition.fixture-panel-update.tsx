import * as React from 'react';
import { useTestButtons, wrap } from '@/test/decorate';
import { keyframes, styled } from '@/test/styled';
import { SwitchTransition } from './switch-transition';
import { createClassSelectors, createTransitionCallback } from './transition';

const colors = [
	'lightblue', 'lightcoral', 'lightcyan', 'lightgoldenrodyellow', 'lightgray', 'lightgreen', 'lightpink', 'lightsalmon',
	'lightseagreen', 'lightskyblue', 'lightyellow'
];

export default wrap(() => {
	const [transitionIndex, setTransitionIndex] = React.useState(0);
	const [childIndex, setChildIndex] = React.useState(0);

	const buttonsRender = useTestButtons({
		'Transition': () => {
			setChildIndex(p => p + 1);
			setTransitionIndex(p => p + 1);
		},
		'Child': () => {
			setChildIndex(p => p + 1);
		}
	});

	const color = colors[childIndex % colors.length];

	const onTransitioning = React.useMemo(() => {
		return createTransitionCallback({
			/*
				One animation can have multiple steps but still only fires the end event once.
				So, we can just say 'true' to end on the first event.
				We also could have multiple transitions running, but we don't want to have any of them 
				end the transition phase, so we always return 'false'.
			*/
			onAnimationEnd: () => true,
			onTransitionEnd: () => false
		});
	}, []);

	return (
		<>
			{buttonsRender}
			<SwapTopContainer>
				<SwitchTransition
					transitionKey={transitionIndex}
					inOnTransitioning={onTransitioning}
					outOnTransitioning={onTransitioning}
				>
					<SwapTransitionContainer>
						<InnerSwapContainer $color={color}>
							<p>
								{transitionIndex} - {childIndex} - {color}
							</p>
						</InnerSwapContainer>
					</SwapTransitionContainer>
				</SwitchTransition>
			</SwapTopContainer>
		</>
	);
});

const TransitionSelectors = createClassSelectors({ useAmpersandPrefix: true });

const SwapTopContainer = styled.div`
	width: 30rem;
	height: 50rem;
	box-sizing: border-box;
	border: 2px solid black;
	position: relative;
	overflow: hidden;
	background-color: #eee;
	box-shadow: 0 0 3px 0 inset #333;
`;

const swapIn = keyframes`
	0% {
		transform: scale(.75) translateX(-1rem) translateY(150%);
		border-radius: 1rem;
	}
	33% {
		transform: scale(.75) translateX(-1rem) translateY(1rem);
		border-radius: 1rem;
	}
	66% {
		transform: scale(.75) translateX(-1rem) translateY(1rem);
		border-radius: 1rem;
	}
	100% {
		transform: scale(1) translateX(0) translateY(0);
		border-radius: 0;
	}
`;

const swapOut = keyframes`
	0% {
		transform: scale(1) translateX(0rem) translateY(0);
		border-radius: 0;
	}
	33% {
		transform: scale(.75) translateX(1rem) translateY(-1rem);
		border-radius: 1rem;
	}
	66% {
		transform: scale(.75) translateX(150%) translateY(-1rem);
		border-radius: 1rem;
	}
	100% {
		transform: scale(.75) translateX(150%) translateY(-1rem);
		border-radius: 1rem;
	}
`;

const SwapTransitionContainer = styled.div`
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

	animation-play-state: paused;
	${TransitionSelectors.exiting} {
		animation: ${swapOut} 3s ease-in-out forwards;
	}
	${TransitionSelectors.entering} {
		animation: ${swapIn} 3s ease-in-out forwards;
	}
	${TransitionSelectors.transitioning} {
		animation-play-state: running;
		box-shadow: 0 0 4px 0px #777;
	}
	${TransitionSelectors.active} {
		z-index: 1;
	}
`;

const InnerSwapContainer = styled.div<{ $color: string; }>`
	flex: 1;

	display: flex;
	justify-content: center;
	align-items: center;

	font-weight: bold;
	font-size: 2rem;
	background-color: ${p => p.$color};
`;
