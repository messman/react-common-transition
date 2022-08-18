import * as React from 'react';
import { wrap } from '@/test/decorate';
import { createClassSelectors } from './transition';
import { styled } from '@/test/styled';
import { enumKeys } from '@/utility';
import { SwitchTransition, SwitchTransitionTiming } from './switch-transition';
import { useSelect } from 'react-cosmos/fixture';

enum Pages {
	a = 1,
	b,
	c
}

const pagesLength = enumKeys(Pages).length;
const timingsOptions = enumKeys(SwitchTransitionTiming);

export default {
	'Base': wrap(() => {

		const [timingKey] = useSelect('Timing', { options: timingsOptions, defaultValue: SwitchTransitionTiming[SwitchTransitionTiming.same] });
		const timing = SwitchTransitionTiming[timingKey as keyof typeof SwitchTransitionTiming];

		const [pageIndex, setPageIndex] = React.useState(Pages.a);

		const [timeIndex, setTimeIndex] = React.useState(1);
		React.useEffect(() => {
			const id = window.setInterval(() => {
				setTimeIndex((p) => {
					return p >= 5000 ? p : p + 1;
				});
			}, 1000);
			return () => {
				window.clearInterval(id);
			};
		}, []);

		function onClickForward() {
			setPageIndex(p => Math.min(p + 1, Pages.a + pagesLength - 1));
		}

		function onClickBackward() {
			setPageIndex(p => Math.max(p - 1, Pages.a));
		}

		const page = pageIndex as Pages;
		const PageComponent = page === Pages.a ? PageA : (page === Pages.b ? PageB : PageC);

		return (
			<>
				<button onClick={onClickForward}>Forward</button>
				<button onClick={onClickBackward}>Backward</button>
				<Container>
					<SwitchTransition
						transitionKey={page}
						timing={timing}
					>
						<AbsoluteContainer>
							<PageComponent>
								{timeIndex.toString()}
							</PageComponent>
						</AbsoluteContainer>
					</SwitchTransition>
				</Container>
			</>
		);
	})
};

const PageA: React.FC<React.PropsWithChildren> = (props) => {
	return (
		<PageContainer $color='blue'>
			<h3>Page A</h3>
			<div>
				{props.children}
			</div>
		</PageContainer>
	);
};

const PageB: React.FC<React.PropsWithChildren> = (props) => {
	return (
		<PageContainer $color='orange'>
			<h4>Page B</h4>
			<div>
				{props.children}
			</div>
		</PageContainer>
	);
};

const PageC: React.FC<React.PropsWithChildren> = (props) => {
	return (
		<PageContainer $color='green'>
			<h5>Page C</h5>
			<div>
				{props.children}
			</div>
		</PageContainer>
	);
};

const Container = styled.div`
	position: relative;
	border: 1px solid #333;
	height: 10rem;
`;

const TransitionSelectors = createClassSelectors({ useAmpersandPrefix: true });

const time = '.2s';

const AbsoluteContainer = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;

	${TransitionSelectors.enter} {
		opacity: 0;
		transform: scale(0.75);
	}
	${TransitionSelectors.entering} {
		opacity: 1;
		transform: translateX(0);
  		transition: opacity ${time}, transform ${time}; // Comment to test default timeout failsafe
	}
	${TransitionSelectors.entered} {
	}
	${TransitionSelectors.exit} {
		opacity: 1;
	}
	${TransitionSelectors.exiting} {
		opacity: 0;
  		transform: scale(0.75);
  		transition: opacity ${time}, transform ${time}; // Comment to test default timeout failsafe
	}
	${TransitionSelectors.exited} {
		opacity: .1;
		transform: scale(0.75);
	}
`;

const PageContainer = styled.div<{ $color: string; }>`
	text-align: center;
	color: white;
	background-color: ${p => p.$color};
	padding: 1rem;
	border-radius: .5rem;
`;