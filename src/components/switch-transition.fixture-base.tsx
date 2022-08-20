import * as React from 'react';
import { useTestButtons, wrap } from '@/test/decorate';
import { createClassSelectors } from './transition';
import { styled } from '@/test/styled';
import { enumKeys } from '@/utility';
import { SwitchTransition, SwitchTransitionTiming } from './switch-transition';
import { useSelect } from 'react-cosmos/fixture';
import { createMountCounter, useEventStatus } from '@/test/test-utility';

enum Color {
	blue = 1,
	orange,
	green
}

const timingsOptions = enumKeys(SwitchTransitionTiming);

export default wrap(() => {

	const [timingKey] = useSelect('Timing', { options: timingsOptions, defaultValue: SwitchTransitionTiming[SwitchTransitionTiming.same] });
	const timing = SwitchTransitionTiming[timingKey as keyof typeof SwitchTransitionTiming];
	const { status, onEntering, onEntered, onExiting, onExited } = useEventStatus();

	const [pageIndex, setPageIndex] = React.useState(Color.blue);

	const buttonsRender = useTestButtons({
		'Blue': () => {
			setPageIndex(Color.blue);
		},
		'Orange': () => {
			setPageIndex(Color.orange);
		},
		'Green': () => {
			setPageIndex(Color.green);
		},
	});

	const page = pageIndex as Color;
	const ColorComponent = page === Color.blue ? Blue : (page === Color.orange ? Orange : Green);

	return (
		<>
			{buttonsRender}
			<p>{status}</p>
			<Container>
				<SwitchTransition
					transitionKey={page}
					timing={timing}
					onEntered={onEntered}
					onEntering={onEntering}
					onExited={onExited}
					onExiting={onExiting}
				>
					<AbsoluteContainer>
						<ColorComponent />
					</AbsoluteContainer>
				</SwitchTransition>
			</Container>
		</>
	);
});

const TransitionSelectors = createClassSelectors({ useAmpersandPrefix: true });

const BlueMountCount = createMountCounter();
const Blue: React.FC<React.PropsWithChildren> = () => {
	return (
		<PageContainer $color='blue' $offset={-2}>
			<h3>Blue</h3>
			<BlueMountCount />
		</PageContainer>
	);
};

const OrangeMountCount = createMountCounter();
const Orange: React.FC<React.PropsWithChildren> = () => {
	return (
		<PageContainer $color='orange' $offset={0}>
			<div>
				<h3>Orange</h3>
				<OrangeMountCount />
			</div>
		</PageContainer>
	);
};

const GreenMountCount = createMountCounter();
const Green: React.FC<React.PropsWithChildren> = () => {
	return (
		<PageContainer $color='green' $offset={2}>
			<div>
				<div>
					<h3>Green</h3>
					<GreenMountCount />
				</div>
			</div>
		</PageContainer>
	);
};

const Container = styled.div`
	position: relative;
	border: 2px solid #333;
	height: 20rem;
	width: 20rem;
`;

const time = '.5s';

const AbsoluteContainer = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;

	${TransitionSelectors.inactive} {
		opacity: 0;
		transform: scale(0.75);
	}
	${TransitionSelectors.active} {
		opacity: 1;
		transform: scale(1);
	}
	${TransitionSelectors.transitioning} {
  		transition: opacity ${time}, transform ${time}; // Comment to test default timeout failsafe
	}
`;

const PageContainer = styled.div<{ $color: string; $offset: number; }>`
	text-align: center;
	color: white;
	background-color: ${p => p.$color};
	margin-left: ${p => p.$offset}rem;
	margin-top: ${p => p.$offset}rem;
	padding: 1rem;
	border-radius: .5rem;
`;