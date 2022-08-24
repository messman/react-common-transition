import * as React from 'react';
import { enumKeys } from '@/utility';

/**
 * The class names used. Prefixes may be required.
*/
export enum TransitionPhaseClass {
	/** Applied briefly before entering starts and the element is mounted and not exited. */
	enterStart = 'enter-start',
	/** Applied for entering. */
	entering = 'entering',
	/** Applied when finished entering. */
	entered = 'entered',

	/** Applied briefly before exiting starts. */
	exitStart = 'exit-start',
	/** Applied for exiting. */
	exiting = 'exiting',
	/** Applied when finished exiting. */
	exited = 'exited',

	/** A shortcut for {@link entering} or {@link exiting} */
	transitioning = 'transitioning',

	/** A shortcut for {@link entering} or {@link entered} or {@link exitStart} */
	active = 'active',

	/** A shortcut for {@link exiting} or {@link exited} or {@link enterStart} */
	inactive = 'inactive',
}

export const defaultClassPrefix = 'rct-';

const transitionPhaseClassKeys = enumKeys(TransitionPhaseClass);

export interface CreateClassSelectorsOptions {
	/** If not provided, uses default. */
	classPrefix?: string;
	/** If not provided, `false`. */
	useAmpersandPrefix?: true;
}

export function createClassSelectors(options?: CreateClassSelectorsOptions): Record<keyof typeof TransitionPhaseClass, string> {
	const classPrefix = options?.classPrefix || defaultClassPrefix;
	const useAmpersandPrefix = options?.useAmpersandPrefix || false;
	const selectors = {} as Record<keyof typeof TransitionPhaseClass, string>;
	transitionPhaseClassKeys.forEach((key) => {
		// Something like '&.myPrefix-entering'
		selectors[key] = `${useAmpersandPrefix ? '&' : ''}.${classPrefix || ''}${TransitionPhaseClass[key]}`;
	});
	return selectors;
}

/** A callback used during non-enter phases. */
export type TransitionPhaseCallback = () => void;
/** A callback used to determine when to move out of the 'entering' or 'exiting' phases. Should return a cleanup function. */
export type OnTransitioningCallback = (element: HTMLElement, isEntering: boolean, done: () => void) => (() => void);


/** Props for the Transition component, based on the old react-transition-group props. */
export interface TransitionProps {
	/** Whether the child component should be shown. */
	isActive: boolean;
	/** Default: {@link defaultClassPrefix}. A prefix for all transition classes. */
	classPrefix?: string | null;
	/** Default: false. If false, child is not rendered when exited. */
	renderWhileExited?: boolean;
	// /**
	//  * Default: false. 
	//  * Set to true when the component should transition in on mount. {@link isActive} must also be true.
	//  * Note - in the event of random re-mounts, this will cause extraneous transitions.
	// */
	// isInactiveOnMount?: boolean;
	/** Default: false. Set to true if there are no enter transitions. If false, a listener will be added to wait on the "transitionend" event. */
	skipEntering?: boolean;
	/** Default: false. Set to true if there are no exit transitions. If false, a listener will be added to wait on the "transitionend" event. */
	skipExiting?: boolean;
	/** If provided, a callback to run when the component begins the 'entering' phase. Callback should be stabilized with `useCallback`. */
	onEntering?: TransitionPhaseCallback;
	/** If provided, a callback to run when the component ends the 'entering' phase. Callback should be stabilized with `useCallback`. */
	onEntered?: TransitionPhaseCallback;
	/** If provided, a callback to run when the component begins the 'exiting' phase. Callback should be stabilized with `useCallback`. */
	onExiting?: TransitionPhaseCallback;
	/** If provided, a callback to run when the component ends the 'exiting' phase. Callback should be stabilized with `useCallback`. */
	onExited?: TransitionPhaseCallback;
	/**
	 * If provided, a callback to be run when 'entering' or 'exiting' phases begin (provided `isNotEntering` and `isNotExiting` are `false`, respectively).
	 * The callback should set up either a 'transitionend' listener or a timeout.
	 * The first argument is the element; the second argument is the `done` callback to be called at the end of the transition.
	 * The function should return a cleanup function in case of a reset.
	 * 
	 * If not provided, a default function will be run that sets a basic 'transitionend' listener and a common-sense timeout.
	 * 
	 * NOTE: be cautious of memory leaks with this function. With great power comes great responsibility. This function should be stabilized with `useCallback`.
	 */
	onTransitioning?: OnTransitioningCallback;
	/**
	 * The single required child. Only the first child is rendered.
	 * Falsy values are undefined behavior.
	*/
	children?: React.ReactNode;
}

/** Internal phase states. */
enum TransitionPhase {
	/** Initial phase describing "the component is starting already mounted in the 'entered' phase". */
	mountAsEntered = 'mountAsEntered',
	unmounted = 'unmounted',
	entering = 'entering',
	entered = 'entered',
	exiting = 'exiting',
	exited = 'exited'
}

/**
 * A transition-tracking component based on `Transition` and `CSSTransition` from `react-transition-group`.
 * 
 * This component is different because: it uses hooks, and thus cannot use some of the DOM tricks from class-based components but is sexier; has fewer props
 * and leaner functionality (and makes more sense); uses "transitionend" instead of any timeouts; uses different class names.
 * 
 * Gotchas: callback functions should be stabilized with `useCallback`, else they may disrupt the "transitionend" event listeners in the `useEffect`.
 */
export const Transition: React.FC<TransitionProps> = (props) => {
	const { isActive, classPrefix: propClassPrefix, renderWhileExited, skipEntering, skipExiting, onEntering, onEntered, onExiting, onExited, onTransitioning, children } = props;

	// Class prefix is always a string... it just might be an empty string.
	const classPrefix = propClassPrefix !== undefined ? (propClassPrefix || '') : defaultClassPrefix;

	const childRef = React.useRef<any>();
	// Initial phase is set here. We don't run mount transitions immediately. Either we're unmounted, existed, or already mounted and "entered".
	const [phase, setPhase] = React.useState(isActive ? TransitionPhase.mountAsEntered : (renderWhileExited ? TransitionPhase.exited : TransitionPhase.unmounted));

	/** Holds common functionality for setting to the 'entered' phase. */
	const setToEntered = React.useCallback(() => {
		setPhase(TransitionPhase.entered);
		setClasses(childRef, TransitionPhase.entered, classPrefix);
		if (onEntered) {
			onEntered();
		}
	}, [onEntered, classPrefix, renderWhileExited]);

	/** Holds common functionality for setting to the 'exited' phase. */
	const setToExited = React.useCallback(() => {
		setPhase(TransitionPhase.exited);
		setClasses(childRef, TransitionPhase.exited, classPrefix);
		if (onExited) {
			onExited();
		}
	}, [onExited, classPrefix, renderWhileExited]);

	/*
		This layout effect runs directly after the render. Since we're applying classes to do the work of changing our child component's look,
		this is almost like a "before" event handler.
		Note, we don't even bother adding dependencies in the dependency array. That's "The React Way" - the code in this effect should be able to 
		run any number of times and not have a negative effect.
	*/
	React.useLayoutEffect(() => {
		// If we don't have a ref, we're not mounted (or one was not passed). Do nothing.
		if (!childRef.current) {
			return;
		}

		// If we shouldn't be active and we're 'exited', we can move to 'unmount'. This is the last step
		// In the cleanup/unmounting workflow. The child component will not render.
		if (!isActive && phase === TransitionPhase.exited) {
			if (!renderWhileExited) {
				setPhase(TransitionPhase.unmounted);
			}
		}
		else if (isActive && phase === TransitionPhase.mountAsEntered) {
			// Special case for the very first render if we should be mounted and ready to go - just apply the 'entered' phase.
			setToEntered();
		}
		else if (isActive && phase !== TransitionPhase.entering && phase !== TransitionPhase.entered) {
			// If we should be active but aren't entering or entered, we must be waiting to kick off.
			// If we shouldn't animate, go straight to entered - else, start entering.
			if (skipEntering) {
				setToEntered();
			}
			else {
				setPhase(TransitionPhase.entering);
				setClasses(childRef, TransitionPhase.entering, classPrefix);
				// Run callback if supplied.
				if (onEntering) {
					onEntering();
				}
			}
		}
		else if (!isActive && (phase === TransitionPhase.entering || phase === TransitionPhase.entered)) {
			// The inverse of the above - if we should not be active but currently are entering or entered, we should start exiting.
			// Though, if we shouldn't do the exiting animation, just go right to 'exited'.
			if (skipExiting) {
				setToExited();
			}
			else {
				setPhase(TransitionPhase.exiting);
				setClasses(childRef, TransitionPhase.exiting, classPrefix);
				if (onExiting) {
					onExiting();
				}
			}
		}
	});

	const isEntering = phase === TransitionPhase.entering;
	const isExiting = phase === TransitionPhase.exiting;
	/*
		This effect makes a subscription to the 'transitionend' event and thus
		we should avoid re-running the effect in case it messes with the event listening.
		The 'transitionend' event should be after either entering or exiting, so we only need 
		to check during those phases.
	*/
	React.useEffect(() => {
		// If we have no ref or we aren't entering or exiting, do nothing.
		if (!childRef.current || (!isEntering && !isExiting)) {
			return;
		}
		let isCleanedUp = false;
		const currentElement = childRef.current as HTMLElement;

		// On completion of transition...
		function done() {
			if (isCleanedUp || (childRef.current !== currentElement)) {
				return;
			}
			if (!currentElement.isConnected) {
				return;
			}
			if (isEntering) {
				setToEntered();
			}
			else if (isExiting) {
				setToExited();
			}
		}

		// Pick a function to use for setting up the 'transitionend' listener.
		const onTransitioningFunc = onTransitioning || defaultOnTransitioning;
		const onTransitioningCleanup = onTransitioningFunc(currentElement, isEntering, done);

		return () => {
			isCleanedUp = true;
			if (onTransitioningCleanup) {
				onTransitioningCleanup();
			}
		};
	}, [isEntering, isExiting, onTransitioning, setToEntered, setToExited]);

	// If we're active and unmounted, we *do* want to render so that we can set the child ref and start applying classes.
	return (phase === TransitionPhase.unmounted && !isActive) ? null : <>{childWithRef(children, childRef)}</>;
};

export interface CreateTransitionCallbackInput {
	/**
	 * Default: 4 seconds.
	 * If provided, the number of milliseconds after which to automatically mark the transition as ended.
	 * Pass `null` to use no timeout. 
	 * A safety timeout is always recommended to prevent cases where the user cannot interact with the application due to the corrupted transition.
	 */
	safetyTimeout: number | null;
	/**
	 * Default: a function that always returns true (signifying to end the transition phase when the first transitionend event is received).
	 * A function used to determine when the transition has ended.
	 * This function is called on every transition event. Return true if the transition phase should end.
	 * A transition even is received for each transition property. The function can contain logic to modify its return value
	 * based on the property being transitioned, the elapsed time, or the element target.
	 */
	onTransitionEnd: (context: OnEndContext<TransitionEvent>) => boolean;
	/**
	 * Default: a function that always returns true (signifying to end the transition phase when the first animationend event is received).
	 * 
	 * Like {@link onTransitionEnd}, but for animation events.
	 */
	onAnimationEnd: (context: OnEndContext<AnimationEvent>) => boolean;
}

export interface OnEndContext<T extends Event> {
	/** The event object. */
	event: T;
	/** The HTML element tracked for the transition. */
	element: HTMLElement;
	/** Whether this is for entering or exiting. */
	isEntering: boolean;
	/** The index */
	index: number;
}

export const defaultCreateTransitionCallbackInput: CreateTransitionCallbackInput = {
	safetyTimeout: 4 * 1000,
	onTransitionEnd: () => true,
	onAnimationEnd: () => true,
};

export function createTransitionCallback(input: Partial<CreateTransitionCallbackInput>): OnTransitioningCallback {
	const { safetyTimeout, onTransitionEnd, onAnimationEnd } = Object.assign({}, defaultCreateTransitionCallbackInput, input);

	return (element, isEntering, done) => {
		let timeoutId = -1;
		let transitionIndex = 0;
		let animationIndex = 0;
		let hasRun = false;

		function cleanUp() {
			element.removeEventListener('transitionend', onTransitionEndEvent);
			element.removeEventListener('animationend', onAnimationEndEvent);
			if (timeoutId !== -1) {
				window.clearTimeout(timeoutId);
			}
		}

		function finish() {
			cleanUp();
			// If the element is no longer connected to the DOM, don't worry about it.
			if (hasRun || !element.isConnected) {
				return;
			}
			hasRun = true;
			done();
		}

		function onTransitionEndEvent(event: TransitionEvent) {
			if (onTransitionEnd({ event, element, isEntering, index: transitionIndex++ })) {
				finish();
			}
		}

		function onAnimationEndEvent(event: AnimationEvent) {
			if (onAnimationEnd({ event, element, isEntering, index: animationIndex++ })) {
				finish();
			}
		}

		if (safetyTimeout !== null) {
			timeoutId = window.setTimeout(finish, safetyTimeout);
		}
		element.addEventListener('transitionend', onTransitionEndEvent);
		element.addEventListener('animationend', onAnimationEndEvent);

		return cleanUp;
	};
}

const defaultOnTransitioning = createTransitionCallback(defaultCreateTransitionCallbackInput);

/** Sets the classes for each phase in the transition. */
function setClasses(ref: React.RefObject<any>, phase: TransitionPhase, classPrefix: string): void {
	if (!ref || !ref.current) {
		return;
	}
	const element = ref.current as HTMLElement;

	function add(...phaseClass: TransitionPhaseClass[]) {
		return element.classList.add(`${classPrefix}${phaseClass}`);
	}
	function remove(phaseClass: TransitionPhaseClass) {
		return element.classList.remove(`${classPrefix}${phaseClass}`);
	}

	// For safety, always remove everything.
	// But, don't remove other classes that may have been added outside this component.
	transitionPhaseClassKeys.forEach((key) => {
		remove(TransitionPhaseClass[key]);
	});

	function reflow() {
		/*
			We need to reflow so that the browser processes the classes we've added.
			This is not always required - and, depending on the use case, it may *never* be required.
			But, we make the safer, less-performant choice here to always include it.
			Otherwise, we'd need to add props to control when reflows occur.
			The 'render while exited' prop is indirectly, but not directly related, to whether or not 
			a reflow is needed.
			Any future change to when reflow happens would be a breaking change, and a big one, as it could break
			any transition or animation.
		*/
		element && element.scrollTop;
	}


	switch (phase) {
		case TransitionPhase.unmounted:
			// We shouldn't even get here.
			break;
		case TransitionPhase.entering:
			add(TransitionPhaseClass.inactive);
			add(TransitionPhaseClass.enterStart);
			//
			reflow();
			//
			remove(TransitionPhaseClass.inactive);
			remove(TransitionPhaseClass.enterStart);
			add(TransitionPhaseClass.active);
			add(TransitionPhaseClass.transitioning);
			add(TransitionPhaseClass.entering);
			break;
		case TransitionPhase.entered:
			add(TransitionPhaseClass.active);
			add(TransitionPhaseClass.entered);
			break;
		case TransitionPhase.exiting:
			add(TransitionPhaseClass.active);
			add(TransitionPhaseClass.exitStart);
			//
			reflow();
			//
			remove(TransitionPhaseClass.active);
			remove(TransitionPhaseClass.exitStart);
			add(TransitionPhaseClass.inactive);
			add(TransitionPhaseClass.transitioning);
			add(TransitionPhaseClass.exiting);
			break;
		case TransitionPhase.exited:
			add(TransitionPhaseClass.inactive);
			add(TransitionPhaseClass.exited);
			break;
	}
}

/** Supply the ref directly to the child. Only allow one child to render. */
function childWithRef(children: React.ReactNode, ref: React.RefObject<any>): JSX.Element | null {
	const firstChild = React.Children.toArray(children)[0];
	if (!firstChild || !React.isValidElement(firstChild)) {
		return null;
	}
	const newChild = React.cloneElement(firstChild, {
		...firstChild.props,
		ref: ref
	});
	return <>{newChild}</>;
}