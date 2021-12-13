import * as React from 'react';
import { wrap } from '@/test/decorate';
import { Transition } from './transition';
import { useValue } from 'react-cosmos/fixture';
import { styled } from '@/test/styled';

export default {
	'Base': wrap(() => {

		const ref = React.useRef();
		const [isActive] = useValue('Is Active', { defaultValue: false });
		const [hasPrefix] = useValue('Has Class Prefix', { defaultValue: false });
		const [hasMountClasses] = useValue('Has Mount Classes', { defaultValue: false });
		const [isNotEntering] = useValue('Is Not Entering', { defaultValue: false });
		const [isNotExiting] = useValue('Is Not Exiting', { defaultValue: false });

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

		return (
			<>
				<p>
					Status: {status}
				</p>
				<Transition
					isActive={isActive}
					childRef={ref}
					classPrefix={hasPrefix ? 'transition-' : undefined}
					hasMountClasses={hasMountClasses}
					isNotEntering={isNotEntering}
					isNotExiting={isNotExiting}
					onEntering={onEntering}
					onEntered={onEntered}
					onExiting={onExiting}
					onExited={onExited}
					onTransitioning={undefined}
				>
					<TestComponent ref={ref} />
				</Transition>
			</>
		);
	})
};

const TestComponent = React.forwardRef<any>((_props, ref) => {
	return (
		<TransitioningDiv ref={ref}>Hello, World!</TransitioningDiv>
	);
});

const TransitioningDiv = styled.div`
	background-color: #fdfdfd;
	border: 2px solid #888;
	border-radius: 1rem;
	width: 10rem;
	height: 3rem;
	padding: 1rem;
	color: #333;
	font-weight: bold;

	&.enter {
		opacity: 0;
		transform: scale(0.9);
	}
	&.entering {
		opacity: 1;
		transform: translateX(0);
  		transition: opacity .5s, transform .5s; // Comment to test default timeout failsafe
	}
	&.entered {
	}
	&.mount {
		color: orange;
		opacity: 0;
		transform: scale(0.5);
	}
	&.mounting {
		opacity: 1;
		transform: translateX(0);
  		transition: opacity 1s, transform 1s; // Comment to test default timeout failsafe
	}
	&.mounted {
	}
	&.exit {
		opacity: 1;
	}
	&.exiting {
		opacity: 0;
  		transform: scale(0.9);
  		transition: opacity .3s, transform .3s; // Comment to test default timeout failsafe
	}
	&.exited {
	}
`;