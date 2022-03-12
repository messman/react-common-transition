import * as React from 'react';

/** The class names used. Prefixes may be required. */
export enum TransitionPhaseClass {
	/** Applied for mount and mounting. */
	mount = 'mount',
	/** Applied for mounting. */
	mounting = 'mounting',
	/** Applied after mounting. */
	mounted = 'mounted',
	/** Applied for enter and entering. */
	enter = 'enter',
	/** Applied for entering. */
	entering = 'entering',
	/** Applied after entering. */
	entered = 'entered',
	/** Applied for exit and exiting. */
	exit = 'exit',
	/** Applied for exiting. */
	exiting = 'exiting',
	/** Applied after exiting and before unmount. */
	exited = 'exited',
}

export const defaultClassPrefix = 'rct-';

function enumKeys<T>(enumObject: T): (keyof T)[] {
	// Note: there are two isNaNs in this world. 
	return Object.keys(enumObject).filter(k => isNaN(Number(k))) as (keyof T)[];
}
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

/** A callback used during enter phases. Includes a boolean argument for whether the enter phase is a mounting phase. */
export type TransitionEnterPhaseCallback = (isMount: boolean) => void;
/** A callback used during non-enter phases. */
export type TransitionPhaseCallback = () => void;
/** A callback used to determine when to move out of the 'entering' or 'exiting' phases. Should return a cleanup function. */
export type OnTransitioningCallback = (element: HTMLElement, done: () => void) => (() => void);


/** Props for the Transition component, based on the old react-transition-group props. */
export interface TransitionProps {
	/** Whether the child component should be shown. */
	isActive: boolean;
	/** Default: {@link defaultClassPrefix}. A prefix for all transition classes. */
	classPrefix?: string | null;
	/** Default: false. If true, 'mount' classes will be used *instead of* 'enter' classes. Always false if {@link isAlwaysMounted} is true. */
	hasMountClasses?: boolean;
	/** Default: false. If true, the child is always mounted and thus {@link hasMountClasses} won't work. */
	isAlwaysMounted?: boolean;
	/** Default: false. Set to true if there are no enter transitions. If false, a listener will be added to wait on the "transitionend" event. */
	skipEntering?: boolean;
	/** Default: false. Set to true if there are no exit transitions. If false, a listener will be added to wait on the "transitionend" event. */
	skipExiting?: boolean;
	/** If provided, a callback to run when the component begins the 'entering' phase. Callback should be stabilized with `useCallback`. */
	onEntering?: TransitionEnterPhaseCallback;
	/** If provided, a callback to run when the component ends the 'entering' phase. Callback should be stabilized with `useCallback`. */
	onEntered?: TransitionEnterPhaseCallback;
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
 * 
 * To use, flip the `isActive` prop. Use `hasMountClasses` to apply special classes on the first mount only.
 */
export const Transition: React.FC<TransitionProps> = (props) => {
	const { isActive, classPrefix: propClassPrefix, hasMountClasses, isAlwaysMounted, skipEntering, skipExiting, onEntering, onEntered, onExiting, onExited, onTransitioning, children } = props;

	// Class prefix is always a string... it just might be an empty string.
	const classPrefix = propClassPrefix !== undefined ? (propClassPrefix || '') : defaultClassPrefix;

	const childRef = React.useRef<any>();
	// Initial phase is set here. We don't run mount transitions immediately. Either we're unmounted, existed, or already mounted and "entered".
	const [phase, setPhase] = React.useState(isActive ? TransitionPhase.mountAsEntered : (isAlwaysMounted ? TransitionPhase.exited : TransitionPhase.unmounted));
	// Track whether we've officially "mounted" and entered yet. We only want to apply the mounting classes the first time we enter, if at all.
	const hasMountedOnceRef = React.useRef<boolean>(!!(isActive || isAlwaysMounted));

	function preventFutureMountingClasses() {
		// We are no longer possibly mounting because we entered once or started to exit.
		hasMountedOnceRef.current = true;
	}

	// We can apply the mounting classes if the props say we can and if we haven't already applied them.
	const canUseMountClasses = !!hasMountClasses && !hasMountedOnceRef.current;

	/*
		This layout effect runs directly after the render. Since we're applying classes to do the work of changing our child component's look,
		this is almost like a "before" event handler.
		Note, we don't even bother adding dependencies in the dependency array. That's "The React Way" - the code in this effect should be able to 
		run any number of times and not have a negative effect.
	*/
	React.useLayoutEffect(() => {
		// If we are planning to enter soon, transition us off the 'unmounted' phase. This will allow the childRef to be populated
		// (It currently isn't because in the 'unmounted' phase we don't render the child and thus there is no set ref.)
		if (isActive && phase === TransitionPhase.unmounted) {
			setPhase(TransitionPhase.exited);
		}
		// If we don't have a ref, we're not mounted (or one was not passed). Do nothing.
		if (!childRef || !childRef.current) {
			return;
		}

		// If we shouldn't be active and we're 'exited', we can move to 'unmount'. This is the last step
		// In the cleanup/unmounting workflow. The child component will not render.
		if (!isActive && phase === TransitionPhase.exited) {
			if (!isAlwaysMounted) {
				setPhase(TransitionPhase.unmounted);
			}
		}
		else if (isActive && phase === TransitionPhase.mountAsEntered) {
			// Special case for the very first render if we should be mounted and ready to go - just apply the 'entered' phase.
			setToEntered(setPhase, childRef, classPrefix, canUseMountClasses, onEntered);
			preventFutureMountingClasses();
		}
		else if (isActive && phase !== TransitionPhase.entering && phase !== TransitionPhase.entered) {
			// If we should be active but aren't entering or entered, we must be waiting to kick off.
			// If we shouldn't animate, go straight to entered - else, start entering.
			if (skipEntering) {
				setToEntered(setPhase, childRef, classPrefix, canUseMountClasses, onEntered);
				preventFutureMountingClasses();
			}
			else {
				setPhase(TransitionPhase.entering);
				setClasses(childRef, TransitionPhase.entering, classPrefix, canUseMountClasses);
				// Run callback if supplied.
				if (onEntering) {
					onEntering(canUseMountClasses);
				}
			}
		}
		else if (!isActive && (phase === TransitionPhase.entering || phase === TransitionPhase.entered)) {
			// The inverse of the above - if we should not be active but currently are entering or entered, we should start exiting.
			// Though, if we shouldn't do the exiting animation, just go right to 'exited'.
			if (skipExiting) {
				setToExited(setPhase, childRef, classPrefix, onExited);
			}
			else {
				setPhase(TransitionPhase.exiting);
				setClasses(childRef, TransitionPhase.exiting, classPrefix, false);
				if (onExiting) {
					onExiting();
				}
			}
			preventFutureMountingClasses();
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
		if (!childRef || !childRef.current || (!isEntering && !isExiting)) {
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
				setToEntered(setPhase, childRef, classPrefix, canUseMountClasses, onEntered);
			}
			else if (isExiting) {
				setToExited(setPhase, childRef, classPrefix, onExited);
			}
			preventFutureMountingClasses();
		}

		// Pick a function to use for setting up the 'transitionend' listener.
		const onTransitioningFunc = onTransitioning || defaultOnTransitioning;
		const onTransitioningCleanup = onTransitioningFunc(currentElement, done);

		return () => {
			isCleanedUp = true;
			if (onTransitioningCleanup) {
				onTransitioningCleanup();
			}
		};
	}, [isEntering, isExiting, childRef, onTransitioning, canUseMountClasses, onEntered, onExited, classPrefix]);


	return phase === TransitionPhase.unmounted ? null : <>{childWithRef(children, childRef)}</>;
};

// After X seconds, say our transition is done. Covers any bugs.
let defaultSafetyTimeout = 4 * 1000;
/** Changes the timeout that runs on default for `onTransitioning` in case the 'transitionend' event does not fire for any reason. */
export function setDefaultSafetyTimeout(timeoutInMilliseconds: number) {
	defaultSafetyTimeout = timeoutInMilliseconds;
}

/** The default transition listener. Includes a timeout in case for some reason the 'transitioned' event doesn't fire. */
const defaultOnTransitioning: OnTransitioningCallback = (element, done) => {
	let timeoutId = -1;
	let hasRun = false;

	function cleanUp() {
		element.removeEventListener('transitionend', onTransitionEnd);
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

	function onTransitionEnd(event: TransitionEvent) {
		if (element === event.target) {
			finish();
		}
	}

	window.setTimeout(finish, defaultSafetyTimeout);
	element.addEventListener('transitionend', onTransitionEnd);

	return cleanUp;
};

/** Holds common functionality for setting to the 'entered' phase. */
function setToEntered(setPhase: (value: React.SetStateAction<TransitionPhase>) => void, ref: React.RefObject<any>, classPrefix: string | undefined, isMounting: boolean, onEntered: TransitionEnterPhaseCallback | undefined): void {
	setPhase(TransitionPhase.entered);
	setClasses(ref, TransitionPhase.entered, classPrefix, isMounting);
	if (onEntered) {
		onEntered(isMounting);
	}
}

/** Holds common functionality for setting to the 'exited' phase. */
function setToExited(setPhase: (value: React.SetStateAction<TransitionPhase>) => void, ref: React.RefObject<any>, classPrefix: string | undefined, onExited: TransitionPhaseCallback | undefined): void {
	setPhase(TransitionPhase.exited);
	setClasses(ref, TransitionPhase.exited, classPrefix, false);
	if (onExited) {
		onExited();
	}
}

/** Sets the classes for each phase in the transition. */
function setClasses(ref: React.RefObject<any>, phase: TransitionPhase, classPrefix: string | undefined, hasMountClasses: boolean): void {
	if (!ref || !ref.current) {
		return;
	}
	const element = ref.current as HTMLElement;

	// Shortcut function for applying the prefix.
	function p(className: keyof typeof TransitionPhaseClass) {
		return classPrefix ? `${classPrefix}${className}` : className;
	}

	// For safety, always remove everything.
	transitionPhaseClassKeys.forEach((key) => {
		element.classList.remove(p(key));
	});

	switch (phase) {
		case TransitionPhase.unmounted:
			// We shouldn't even get here.
			break;
		case TransitionPhase.entering:
			// Add either mount or enter; cause reflow to trigger styles; add more classes.
			element.classList.add(hasMountClasses ? p('mount') : p('enter'));
			element && element.scrollTop; // reflow
			element.classList.add(hasMountClasses ? p('mounting') : p('entering'));
			break;
		case TransitionPhase.entered:
			if (hasMountClasses) {
				element.classList.add(p('mounted'));
			}
			// Always add 'entered' even when using mount classes, as a backup.
			element.classList.add(p('entered'));
			break;
		case TransitionPhase.exiting:
			// Add exit; cause reflow to trigger styles; add more classes.
			element.classList.add(p('exit'));
			element && element.scrollTop; // reflow
			element.classList.add(p('exiting'));
			break;
		case TransitionPhase.exited:
			// Apply the exited class.
			element.classList.add(p('exited'));
			break;
	}
}

function childWithRef(children: React.ReactNode, ref: React.RefObject<any>): JSX.Element {
	const firstChild = React.Children.toArray(children)[0];
	if (!firstChild || !React.isValidElement(firstChild)) {
		throw new Error('Transition child must be a valid react element');
	}
	const newChild = React.cloneElement(firstChild, {
		...firstChild.props,
		ref: ref
	});
	return <>{newChild}</>;
}