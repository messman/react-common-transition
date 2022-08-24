import * as React from 'react';
import { useTestButtons, wrap } from '@/test/decorate';
import { styled } from '@/test/styled';
import { useEventStatus } from '@/test/test-utility';
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
		<InnerMultiStageContainer $color='lightgreen'>
			<div>
				<p>First</p>
			</div>
		</InnerMultiStageContainer>
	) : (
		<InnerMultiStageContainer $color='lightblue'>
			<div>
				<p>Second</p>
			</div>
		</InnerMultiStageContainer>
	);

	const onTransitioning = React.useMemo(() => {
		return createTransitionCallback({
			onTransitionEnd: (context) => {
				console.log(context);
				/*
					See from the logs that you get an event for each subtype of
					border-radius: left, top, right, bottom. So you need to 
					either pick a specific property name to end on or an index.
				*/
				return context.index === 5; // 3 transitions, but one is worth 4.
			}
		});
	}, []);

	return (
		<>
			{buttonsRender}
			<p>{status}</p>
			<MultiStageTopContainer>
				<SwitchTransition
					transitionKey={isFirst}
					inOnTransitioning={onTransitioning}
					outOnTransitioning={onTransitioning}
					onEntering={onEntering}
					onEntered={onEntered}
					onExiting={onExiting}
					onExited={onExited}
				>
					<MultiStageTransitionContainer>
						{render}
					</MultiStageTransitionContainer>
				</SwitchTransition>
			</MultiStageTopContainer>
		</>
	);
});

const TransitionSelectors = createClassSelectors({ useAmpersandPrefix: true });

const MultiStageTopContainer = styled.div`
	width: 20rem;
	height: 10rem;
	box-sizing: border-box;
	border: 2px solid black;
	position: relative;
	overflow: hidden;
`;

const InnerMultiStageContainer = styled.div<{ $color: string; }>`
	flex: 1;

	display: flex;
	justify-content: center;
	align-items: center;

	font-weight: bold;
	font-size: 2rem;
	background-color: ${p => p.$color};
	margin: 1rem;
`;

const MultiStageTransitionContainer = styled.div`
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

	transition-timing-function: ease;

	${TransitionSelectors.inactive} {
		opacity: 0;
		transform: translateX(100%);

		${InnerMultiStageContainer} {
			border-radius: 2rem;
		}
	}
	${TransitionSelectors.active} {
		opacity: 1;
		transform: translateX(0);

		${InnerMultiStageContainer} {
			border-radius: 0;
		}
	}
	${TransitionSelectors.enterStart} {
		transform: translateX(-100%);
	}
	${TransitionSelectors.entering} {
		transition: opacity .5s .25s, transform .5s .25s;

		${InnerMultiStageContainer} {
			transition: border-radius .25s .75s;
		}
	}
	${TransitionSelectors.exiting} {
		transition: opacity .5s .25s, transform .5s .25s;

		${InnerMultiStageContainer} {
			transition: border-radius .25s 0s;
		}
	}
`;
