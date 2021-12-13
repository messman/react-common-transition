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

		const onEntering = React.useCallback(() => {
			console.log('Entering...');
		}, []);
		const onEntered = React.useCallback(() => {
			console.log('Entered!');
		}, []);
		const onExiting = React.useCallback(() => {
			console.log('Exiting...');
		}, []);
		const onExited = React.useCallback(() => {
			console.log('Exited!');
		}, []);

		return (
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
			>
				<TestComponent ref={ref} />
			</Transition>
		);
	})
};

const TestComponent = React.forwardRef<any>((_props, ref) => {

	React.useLayoutEffect(() => {
		console.log('Test - Layout Effect');
	});

	React.useEffect(() => {
		console.log('Test - Effect');
	});

	return (
		<TransitioningDiv ref={ref}>Hello!</TransitioningDiv>
	);
});

const TransitioningDiv = styled.div`
	width: 400px;
	height: 400px;
	padding: 1rem;
	color: white;
	font-weight: bold;
	border: 1px solid white;

	&.enter {
		background-color: green;
	}
	&.entering {
		background-color: skyblue;
	}
	&.entered {
		background-color: skyblue;
		text-decoration: underline;
	}
	&.mount {
		background-color: red;
	}
	&.mounting {
		background-color: orange;
	}
	&.mounted {
		background-color: orange;
		text-decoration: underline;
	}
	&.exit {
		background-color: pink;
	}
	&.exiting {
		background-color: purple;
	}
	&.exited {
		background-color: purple;
	}

	transition: all 2s ease;
`;