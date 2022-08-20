import * as React from 'react';

export function createMountCounter(): React.FC {
	let mountIndex = 0;

	return () => {
		const renderRef = React.useRef(1);
		const mountRef = React.useRef<number>(null!);
		if (mountRef.current === null) {
			mountRef.current = ++mountIndex;
		}

		React.useEffect(() => {
			renderRef.current++;
		});

		return (
			<div>Mounts: {mountRef.current}, Renders: {renderRef.current}</div>
		);
	};
}

export function useEventStatus() {
	const [status, setStatus] = React.useState('Ready');
	const onEntering = React.useCallback(() => {
		setStatus('Entering...');
		console.log('Entering');
	}, []);
	const onEntered = React.useCallback(() => {
		setStatus('Entered!');
		console.log('Entered');
	}, []);
	const onExiting = React.useCallback(() => {
		setStatus('Exiting...');
		console.log('Exiting');
	}, []);
	const onExited = React.useCallback(() => {
		setStatus('Exited!');
		console.log('Exited');
	}, []);

	return {
		status,
		onEntering,
		onEntered,
		onExiting,
		onExited
	};
}