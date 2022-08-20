import * as React from 'react';
import { OnTransitioningCallback, Transition, TransitionPhaseCallback, TransitionProps } from './transition';

export enum SwitchTransitionTiming {
	exitFirst = 1,
	enterFirst,
	same
}

/** Props for the SwitchTransition component. */
export interface SwitchTransitionProps extends Pick<TransitionProps, /* Cannot do renderWhileExited. */ 'classPrefix' | 'onEntering' | 'onEntered' | 'onExiting' | 'onExited'> {
	/**
	 * Required. A key used to differentiate between children.
	 * If the key changes, the transition occurs.
	*/
	transitionKey: React.Key;
	/**
	 * The single required child.
	 * Transitions occur not when the child changes, but when the key changes.
	*/
	children?: React.ReactNode;
	/**
	 * If provided, the element to be transitioned out instead of the old cached child.
	 * Useful if, for example, the cached child would otherwise throw an error due to contextual state change.
	*/
	outRender?: JSX.Element | null;
	/**
	 * Default: the old child and new child transition at the same time. If provided, transitions will occur at a different point.
	 */
	timing?: SwitchTransitionTiming;
	/**
	 * See {@link TransitionProps.onTransitioning}.
	*/
	inOnTransitioning?: OnTransitioningCallback;
	/**
	 * See {@link TransitionProps.onTransitioning}.
	*/
	outOnTransitioning?: OnTransitioningCallback;
}

interface State {
	inKey: React.Key;
	outKey: React.Key;
	isFirstTimingPhaseComplete: boolean;
}

/**
 * A transition-tracking component based on `SwitchTransition` from `react-transition-group`. This component builds on the Transition component.
 * 
 * Gotchas: callback functions should be stabilized with `useCallback`, else they may disrupt the "transitionend" event listeners in the `useEffect`.
 */
export const SwitchTransition: React.FC<SwitchTransitionProps> = (props) => {
	// Treat our props as "what is next", because we immediately queue up another render when they change.
	// In this way, it's like we're looking into the future.
	const {
		transitionKey: thisRenderKey,
		children: thisRenderChildren,
		outRender: propsOutRender,
		timing,
		classPrefix,
		inOnTransitioning,
		outOnTransitioning,
		onEntered,
		onEntering,
		onExited,
		onExiting
	} = props;
	const thisRenderChild = firstChild(thisRenderChildren);

	const [state, setState] = React.useState<State>(() => {
		return {
			inKey: thisRenderKey,
			outKey: thisRenderKey,
			isFirstTimingPhaseComplete: true,
		};
	});
	const { inKey, outKey, isFirstTimingPhaseComplete } = state;

	React.useEffect(() => {
		// If we see in the future that we're going to transition,
		// update our saved keys.
		if (thisRenderKey !== inKey) {
			setState({
				inKey: thisRenderKey,
				outKey: inKey,
				isFirstTimingPhaseComplete: false
			});
		}
	}, [thisRenderKey, inKey]);

	const onFinishedSwitch = React.useCallback(() => {
		setState((p) => {
			return {
				inKey: p.inKey,
				outKey: p.inKey,
				isFirstTimingPhaseComplete: true
			};
		});
	}, []);

	const onFinishedFirstTimingPhase = React.useCallback(() => {
		setState((p) => {
			return {
				...p,
				isFirstTimingPhaseComplete: true
			};
		});
	}, []);

	const onFinishingSame = React.useCallback(() => {
		setState((p) => {
			if (p.isFirstTimingPhaseComplete) {
				return {
					inKey: p.inKey,
					outKey: p.inKey,
					isFirstTimingPhaseComplete: true
				};
			}
			return {
				...p,
				isFirstTimingPhaseComplete: true
			};
		});
	}, []);

	/*
		We have what's going on this render, and we have in and out.
		We need to figure out which one or two of those three we're rendering.

		The reason we need to look into the future is so that we can set up the
		Transition component to be active/inactive and then flip it to cause
		the transition.
	*/
	const isRightBeforeTransition = thisRenderKey !== inKey;
	const isTransitioning = inKey !== outKey;

	/*
		We hold on to the child so that when a new one comes along we can use the
		stored child as the out render.
	*/
	const previousChildRef = React.useRef<React.ReactNode>(thisRenderChild);
	const outChildRef = React.useRef<React.ReactNode>(thisRenderChild);
	if (isRightBeforeTransition) {
		outChildRef.current = clone(previousChildRef.current);
	}
	previousChildRef.current = thisRenderChild;
	const outChild = outChildRef.current;

	let inRenderKey = inKey;
	const inRender = thisRenderChild;
	let isInTransitionActive = true;
	let isInSkipEntering = true;
	let inOnEnteredFunc: TransitionPhaseCallback | undefined = undefined;

	let outRenderKey: React.Key = '_out_none_';
	let outRender = null;
	let isOutTransitionActive = false;
	let isOutSkipExiting = true;
	let outOnExitedFunc: TransitionPhaseCallback | undefined = undefined;

	if (isRightBeforeTransition || isTransitioning) {
		inRenderKey = isRightBeforeTransition ? thisRenderKey : inKey;
		outRenderKey = isRightBeforeTransition ? inKey : outKey;
		outRender = propsOutRender || outChild;
		isInSkipEntering = false;
		isOutSkipExiting = false;

		/*
			"In" will start inactive and then become active to run transition
			"Out" will start active and then become inactive
		*/

		if (timing === SwitchTransitionTiming.enterFirst) {
			isInTransitionActive = isTransitioning && !isRightBeforeTransition;
			inOnEnteredFunc = onFinishedFirstTimingPhase;

			isOutTransitionActive = isRightBeforeTransition || !isFirstTimingPhaseComplete;
			outOnExitedFunc = onFinishedSwitch;
		}
		else if (timing === SwitchTransitionTiming.exitFirst) {
			isInTransitionActive = isTransitioning && !isRightBeforeTransition && isFirstTimingPhaseComplete;
			inOnEnteredFunc = onFinishedSwitch;

			isOutTransitionActive = isRightBeforeTransition;
			outOnExitedFunc = onFinishedFirstTimingPhase;
		}
		else { // Default / undefined, same
			isInTransitionActive = isTransitioning && !isRightBeforeTransition;
			inOnEnteredFunc = onFinishingSame;

			isOutTransitionActive = isRightBeforeTransition;
			outOnExitedFunc = onFinishingSame;
		}
	}

	function wrappedInOnEntered() {
		if (inOnEnteredFunc) {
			inOnEnteredFunc();
		}
		if (onEntered) {
			onEntered();
		}
	}
	function wrappedOutOnExited() {
		if (outOnExitedFunc) {
			outOnExitedFunc();
		}
		if (onExited) {
			onExited();
		}
	}

	return (
		<>
			<Transition
				key={inRenderKey}
				isActive={isInTransitionActive}
				classPrefix={classPrefix}
				skipEntering={isInSkipEntering}
				skipExiting={true}
				onEntering={onEntering}
				onEntered={wrappedInOnEntered}
				onExited={undefined}
				onExiting={undefined}
				onTransitioning={inOnTransitioning}
			>
				{inRender}
			</Transition>
			<Transition
				key={outRenderKey}
				isActive={isOutTransitionActive}
				classPrefix={classPrefix}
				skipEntering={true}
				skipExiting={isOutSkipExiting}
				onExiting={onExiting}
				onExited={wrappedOutOnExited}
				onEntered={undefined}
				onEntering={undefined}
				onTransitioning={outOnTransitioning}
			>
				{outRender}
			</Transition>
		</>
	);
};

function firstChild(children: React.ReactNode): React.ReactNode {
	return React.Children.toArray(children)[0];
}

function clone(child: React.ReactNode): React.ReactNode {
	if (!child || !React.isValidElement(child)) {
		return null;
	}
	return React.cloneElement(child, {
		...child.props,
	});
}