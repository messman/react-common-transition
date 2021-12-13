import * as React from 'react';

export enum TransitionPhaseClass {
	mount = 'mount',
	mounting = 'mounting',
	mounted = 'mounted',
	enter = 'enter',
	entering = 'entering',
	entered = 'entered',
	exit = 'exit',
	exiting = 'exiting',
	exited = 'exited',
}

export type TransitionEnterPhaseCallback = (isMount: boolean) => void;
export type TransitionPhaseCallback = () => void;

export interface TransitionProps {
	isActive: boolean;
	childRef: React.RefObject<any>;
	classPrefix?: string;
	hasMountClasses?: boolean;
	isNotEntering?: boolean;
	isNotExiting?: boolean;
	onEntering?: TransitionEnterPhaseCallback;
	onEntered?: TransitionEnterPhaseCallback;
	onExiting?: TransitionPhaseCallback;
	onExited?: TransitionPhaseCallback;
}

enum TransitionPhase {
	mountAsEntered = 'mountAsEntered',
	unmounted = 'unmounted',
	entering = 'entering',
	entered = 'entered',
	exiting = 'exiting',
	exited = 'exited'
}

export const Transition: React.FC<TransitionProps> = (props) => {
	const { isActive, childRef, classPrefix, hasMountClasses, isNotEntering, isNotExiting, onEntering, onEntered, onExiting, onExited, children } = props;

	const [phase, setPhase] = React.useState(isActive ? TransitionPhase.mountAsEntered : TransitionPhase.unmounted);
	const hasMountedOnceRef = React.useRef<boolean>(false);

	function preventMounting() {
		// We are no longer possibly mounting because we entered once or started to exit.
		hasMountedOnceRef.current = true;
	}

	const canUseMountClasses = !!hasMountClasses && !hasMountedOnceRef.current;

	React.useLayoutEffect(() => {
		console.log({ isActive, phase });
		if (isActive && phase === TransitionPhase.unmounted) {
			setPhase(TransitionPhase.exited);
		}
		if (!childRef || !childRef.current) {
			return;
		}

		if (!isActive && phase === TransitionPhase.exited) {
			setPhase(TransitionPhase.unmounted);
		}
		else if (isActive && phase === TransitionPhase.mountAsEntered) {
			setToEntered(setPhase, childRef, classPrefix, canUseMountClasses, onEntered);
			preventMounting();
		}
		else if (isActive && phase !== TransitionPhase.entering && phase !== TransitionPhase.entered) {
			if (isNotEntering) {
				setToEntered(setPhase, childRef, classPrefix, canUseMountClasses, onEntered);
				preventMounting();
			}
			else {
				setPhase(TransitionPhase.entering);
				setClasses(childRef, TransitionPhase.entering, classPrefix, canUseMountClasses);
				if (onEntering) {
					onEntering(canUseMountClasses);
				}
			}
		}
		else if (!isActive && (phase === TransitionPhase.entering || phase === TransitionPhase.entered)) {
			if (isNotExiting) {
				setToExited(setPhase, childRef, classPrefix, onExited);
			}
			else {
				setPhase(TransitionPhase.exiting);
				setClasses(childRef, TransitionPhase.exiting, classPrefix, false);
				if (onExiting) {
					onExiting();
				}
			}
			preventMounting();
		}
		console.log('Layout Effect + ' + !!childRef.current);
	});

	const isEntering = phase === TransitionPhase.entering;
	const isExiting = phase === TransitionPhase.exiting;
	React.useEffect(() => {
		if (!childRef || !childRef.current || (!isEntering && !isExiting)) {
			return;
		}
		let isCleanedUp = false;

		function onTransitionEnd(_e: TransitionEvent) {
			const element = (childRef.current as HTMLElement);
			if (!element) {
				return;
			}
			element.removeEventListener("transitionend", onTransitionEnd);
			if (isCleanedUp) {
				return;
			}

			if (isEntering) {
				setToEntered(setPhase, childRef, classPrefix, canUseMountClasses, onEntered);
			}
			else if (isExiting) {
				setToExited(setPhase, childRef, classPrefix, onExited);
			}
			preventMounting();
		}
		(childRef.current as HTMLElement).addEventListener("transitionend", onTransitionEnd);

		return () => {
			isCleanedUp = true;
		};
	}, [isEntering, isExiting, childRef, canUseMountClasses, onEntered, onExited, classPrefix]);


	return phase === TransitionPhase.unmounted ? null : <>{children}</>;
};

function setToEntered(setPhase: (value: React.SetStateAction<TransitionPhase>) => void, ref: React.RefObject<any>, classPrefix: string | undefined, isMounting: boolean, onEntered: TransitionEnterPhaseCallback | undefined): void {
	setPhase(TransitionPhase.entered);
	setClasses(ref, TransitionPhase.entered, classPrefix, isMounting);
	if (onEntered) {
		onEntered(isMounting);
	}
}

function setToExited(setPhase: (value: React.SetStateAction<TransitionPhase>) => void, ref: React.RefObject<any>, classPrefix: string | undefined, onExited: TransitionPhaseCallback | undefined): void {
	setPhase(TransitionPhase.exited);
	setClasses(ref, TransitionPhase.exited, classPrefix, false);
	if (onExited) {
		onExited();
	}
}

function setClasses(ref: React.RefObject<any>, phase: TransitionPhase, classPrefix: string | undefined, hasMountClasses: boolean): void {
	if (!ref || !ref.current) {
		return;
	}
	const element = ref.current as HTMLElement;

	function p(className: keyof typeof TransitionPhaseClass) {
		return classPrefix ? `${classPrefix}${className}` : className;
	}

	switch (phase) {
		case TransitionPhase.unmounted:
			break;
		case TransitionPhase.entering:
			element.classList.remove(p('exit'), p('exiting'), p('exited'));
			element.classList.add(hasMountClasses ? p('mount') : p('enter'));
			element && element.scrollTop; // reflow
			element.classList.add(hasMountClasses ? p('mounting') : p('entering'));
			break;
		case TransitionPhase.entered:
			element.classList.remove(p('mount'), p('mounting'), p('mounted'));
			element.classList.remove(p('enter'), p('entering'), p('entered'));
			if (hasMountClasses) {
				element.classList.add(p('mounted'));
			}
			// Always add 'entered' even when using mount classes.
			element.classList.add(p('entered'));
			break;
		case TransitionPhase.exiting:
			element.classList.remove(p('mount'), p('mounting'), p('mounted'));
			element.classList.remove(p('enter'), p('entering'), p('entered'));
			element.classList.add(p('exit'));
			element && element.scrollTop; // reflow
			element.classList.add(p('exiting'));
			break;
		case TransitionPhase.exited:
			element.classList.remove(p('exit'), p('exiting'));
			element.classList.add(p('exited'));
			break;
	}
}