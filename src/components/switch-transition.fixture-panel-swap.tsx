import * as React from 'react';
import { useTestButtons, wrap } from '@/test/decorate';
import { keyframes, styled } from '@/test/styled';
import { createMountCounter, useEventStatus } from '@/test/test-utility';
import { SwitchTransition } from './switch-transition';
import { createClassSelectors, createTransitionCallback } from './transition';

export default wrap(() => {
	const [isFirst, setIsFirst] = React.useState(true);
	const { status, onEntering, onEntered, onExiting, onExited } = useEventStatus();

	const buttonsRender = useTestButtons({
		'Swap': () => {
			setIsFirst(p => !p);
		}
	});

	let render = isFirst ? (
		<InnerSwapContainer $color='lightgreen'>
			<div>
				<p>First</p>
				<FirstMountCount />
			</div>
		</InnerSwapContainer>
	) : (
		<InnerSwapContainer $color='lightblue'>
			<div>
				<p>Second</p>
				<SecondMountCount />
			</div>
		</InnerSwapContainer>
	);

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
			<p>{status}</p>
			<SwapTopContainer>
				<SwitchTransition
					transitionKey={isFirst}
					inOnTransitioning={onTransitioning}
					outOnTransitioning={onTransitioning}
					onEntering={onEntering}
					onEntered={onEntered}
					onExiting={onExiting}
					onExited={onExited}
				>
					<SwapTransitionContainer>
						{render}
					</SwapTransitionContainer>
				</SwitchTransition>
			</SwapTopContainer>
		</>
	);
});

const TransitionSelectors = createClassSelectors({ useAmpersandPrefix: true });

const FirstMountCount = createMountCounter();
const SecondMountCount = createMountCounter();

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
		animation: ${swapOut} 1.5s ease-in-out forwards;
	}
	${TransitionSelectors.entering} {
		animation: ${swapIn} 1.5s ease-in-out forwards;
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
