import * as React from 'react';
import { wrap } from '@/test/decorate';
import { createClassSelectors, Transition } from './transition';
import { useValue } from 'react-cosmos/fixture';
import { styled } from '@/test/styled';

export default {
	'Base': wrap(() => {

		const [isActive] = useValue('Is Active', { defaultValue: false });
		const [skipEntering] = useValue('Skip Entering', { defaultValue: false });
		const [skipExiting] = useValue('Skip Exiting', { defaultValue: false });
		const [renderWhileExited] = useValue('Render While Exited', { defaultValue: false });

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
					renderWhileExited={renderWhileExited}
					skipEntering={skipEntering}
					skipExiting={skipExiting}
					onEntering={onEntering}
					onEntered={onEntered}
					onExiting={onExiting}
					onExited={onExited}
					onTransitioning={undefined}
				>
					<TestComponent testString={'Testing'} />
				</Transition>
			</>
		);
	})
};

interface TestComponentProps {
	testString: string;
}

const TestComponent = React.forwardRef<any, TestComponentProps>((props, ref) => {
	return (
		<TransitioningDiv ref={ref}>Hello, World! ({props.testString})</TransitioningDiv>
	);
});

const TransitionSelectors = createClassSelectors({ useAmpersandPrefix: true });

const TransitioningDiv = styled.div`
	background-color: #fdfdfd;
	border: 2px solid #888;
	border-radius: 1rem;
	width: 10rem;
	height: 3rem;
	padding: 1rem;
	color: #333;
	font-weight: bold;

	${TransitionSelectors.enter} {
		opacity: 0;
		transform: scale(0.9);
	}
	${TransitionSelectors.entering} {
		opacity: 1;
		transform: translateX(0);
  		transition: opacity .5s, transform .5s; // Comment to test default timeout failsafe
	}
	${TransitionSelectors.entered} {
	}
	${TransitionSelectors.exit} {
		opacity: 1;
	}
	${TransitionSelectors.exiting} {
		opacity: 0;
  		transform: scale(0.9);
  		transition: opacity .3s, transform .3s; // Comment to test default timeout failsafe
	}
	${TransitionSelectors.exited} {
		opacity: .1;
		transform: scale(0.9);
		color: red;
	}
`;