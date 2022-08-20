import * as React from 'react';
import { wrap } from '@/test/decorate';
import { createClassSelectors, createTransitionCallback, OnEndContext, Transition } from './transition';
import { useValue } from 'react-cosmos/fixture';
import { css, keyframes, styled } from '@/test/styled';
import { useEventStatus } from '@/test/test-utility';

export default {
	'Base': wrap(() => {

		const [isActive] = useValue('Is Active', { defaultValue: false });
		const [skipEntering] = useValue('Skip Entering', { defaultValue: false });
		const [skipExiting] = useValue('Skip Exiting', { defaultValue: false });
		const [renderWhileExited] = useValue('Render While Exited', { defaultValue: false });

		const { status, onEntering, onEntered, onExiting, onExited } = useEventStatus();

		return (
			<>
				<p>
					Status: {status}
				</p>
				<Transition
					isActive={isActive}
					renderWhileExited={renderWhileExited}
					skipEntering={skipEntering}
					skipExiting={skipExiting}
					onEntering={onEntering}
					onEntered={onEntered}
					onExiting={onExiting}
					onExited={onExited}
					onTransitioning={undefined}
				>
					<TransitioningDiv renderingWhileExited={renderWhileExited}>Hello, World!</TransitioningDiv>
				</Transition>
			</>
		);
	}),
	'Forward Ref': wrap(() => {
		const [isActive] = useValue('Is Active', { defaultValue: false });
		return (
			<Transition
				isActive={isActive}
			>
				<ForwardRefComponent />
			</Transition>
		);
	}),
	'Safety Timeout': wrap(() => {
		const [isActive] = useValue('Is Active', { defaultValue: false });
		const { status, onEntering, onEntered, onExiting, onExited } = useEventStatus();
		return (
			<>
				<p>
					Status: {status}
				</p>
				<Transition
					isActive={isActive}
					onEntering={onEntering}
					onEntered={onEntered}
					onExiting={onExiting}
					onExited={onExited}
				>
					<TransitionExitOnly>
						<p>This transition will hit the default timeout when entering.</p>
					</TransitionExitOnly>
				</Transition>
			</>
		);
	}),
	'Multi-stage': wrap(() => {
		const [isActive] = useValue('Is Active', { defaultValue: false });

		const [contexts, setContexts] = React.useState<OnEndContext<TransitionEvent>[]>([]);

		React.useEffect(() => {
			setContexts([]);
		}, [isActive]);

		const transitionsRender = contexts.map((context) => {
			const { event, index, isEntering } = context;
			const { propertyName, elapsedTime } = event;
			const enterText = isEntering ? 'enter' : 'exit';
			const key = `${enterText}-${propertyName}-${elapsedTime}`;
			return (
				<p key={key}>{index}: <code>{propertyName}</code> after <code>{elapsedTime}</code> ({enterText})</p>
			);
		});

		const onTransitioning = React.useMemo(() => {
			return createTransitionCallback({
				onTransitionEnd: (context) => {
					setContexts((p) => {
						return [...p, context];
					});
					return context.event.target === context.element && isMultiStageEnterDone(context);
				}
			});
		}, []);

		return (
			<>
				<Transition
					isActive={isActive}
					onTransitioning={onTransitioning}
				>
					<MultiStageTransition>
						<p>Opacity, Scale, and Color</p>
					</MultiStageTransition>
				</Transition>
				<div>
					{transitionsRender}
				</div>
			</>
		);
	}),
	'Animation': wrap(() => {
		const [isActive] = useValue('Is Active', { defaultValue: false });
		const { status, onEntering, onEntered, onExiting, onExited } = useEventStatus();
		return (
			<>
				<p>{status}</p>
				<Transition
					isActive={isActive}
					onEntering={onEntering}
					onEntered={onEntered}
					onExiting={onExiting}
					onExited={onExited}
				>
					<AnimationDiv>
						<p>Animation!</p>
					</AnimationDiv>
				</Transition>
			</>
		);
	})
};

const ForwardRefComponent = React.forwardRef<any, {}>((_props, ref) => {
	return (
		<Padding>
			<Padding>
				<TransitioningDiv renderingWhileExited={false} ref={ref}>Hello, World!</TransitioningDiv>
			</Padding>
		</Padding>
	);
});

const Padding = styled.div`
	padding: 1rem;	
`;

const TransitionSelectors = createClassSelectors({ useAmpersandPrefix: true });

const opacityScaleTransition = css`
	${TransitionSelectors.inactive} {
		opacity: 0;
		transform: scale(0.9);
	}
	${TransitionSelectors.active} {
		opacity: 1;
		transform: translateX(0);
	}
	${TransitionSelectors.entering} {
		transition: opacity .5s, transform .5s;
	}
	${TransitionSelectors.exiting} {
		transition: opacity .3s, transform .3s;
	}
`;

const TransitioningDiv = styled.div<{ renderingWhileExited: boolean; }>`
	background-color: #fdfdfd;
	border: 2px solid #888;
	border-radius: 1rem;
	width: 10rem;
	height: 3rem;
	padding: 1rem;
	color: #333;
	font-weight: bold;

	${opacityScaleTransition}
	${TransitionSelectors.inactive} {
		opacity: ${p => p.renderingWhileExited ? .3 : 0};
	}
	${TransitionSelectors.exited} {
		color: red;
	}
`;

const TransitionExitOnly = styled.div`
	background-color: #fdfdfd;
	border: 2px solid #888;
	border-radius: 1rem;
	width: 10rem;
	height: 3rem;
	padding: 1rem;
	color: #333;
	font-weight: bold;

	${opacityScaleTransition}
	${TransitionSelectors.entering} {
		transition-duration: 10s;
	}
`;

const MultiStageTransition = styled.div`
	${TransitionSelectors.inactive} {
		opacity: 0;
		transform: translateX(0);
		color: red;
	}
	${TransitionSelectors.active} {
		opacity: 1;
		transform: translateX(1.5rem);
		color: green;
	}
	${TransitionSelectors.entering} {
  		transition: opacity .5s 0s, transform .5s .5s, color .5s 1s;
	}
	${TransitionSelectors.exiting} {
  		transition: color .2s 0s, transform .4s .2s, opacity .3s .6s;
	}
`;
const isMultiStageEnterDone = (context: OnEndContext<TransitionEvent>) => context.isEntering ? context.event.propertyName === 'color' : context.event.propertyName === 'opacity';


const shiftIn = keyframes`
	0% {
		transform: translateX(0) translateY(0) rotateZ(0deg);
	}
	50% {
		transform: translateX(2rem) translateY(0) rotateZ(0deg);
	}
	100% {
		transform: translateX(2rem) translateY(2rem) rotateZ(30deg);
	}
`;

const AnimationDiv = styled.div`
	background-color: #fdfdfd;
	border: 2px solid #888;
	border-radius: 1rem;
	width: 10rem;
	height: 3rem;
	padding: 1rem;
	color: #333;
	font-weight: bold;

	${TransitionSelectors.inactive} {
		animation: ${shiftIn} 2s forwards ease reverse;
	}
	${TransitionSelectors.entering} {
		animation: ${shiftIn} 2s forwards ease;
	}
	${TransitionSelectors.entered} {
		transform: translateX(2rem) translateY(2rem) rotateZ(30deg);
	}
	${TransitionSelectors.exited} {
		transform: translateX(0) translateY(0) rotateZ(0deg);
	}
`;
