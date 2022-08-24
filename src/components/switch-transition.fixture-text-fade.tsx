import * as React from 'react';
import { useSelect } from 'react-cosmos/fixture';
import { useTestButtons, wrap } from '@/test/decorate';
import { styled } from '@/test/styled';
import { enumKeys } from '@/utility';
import { SwitchTransition, SwitchTransitionTiming } from './switch-transition';
import { createClassSelectors } from './transition';

const timingsOptions = enumKeys(SwitchTransitionTiming);

export default wrap(() => {

	const [timingKey] = useSelect('Timing', { options: timingsOptions, defaultValue: SwitchTransitionTiming[SwitchTransitionTiming.same] });
	const timing = SwitchTransitionTiming[timingKey as keyof typeof SwitchTransitionTiming];

	const [index, setIndex] = React.useState(0);
	const text = texts[index] || null;

	const buttonsRender = useTestButtons({
		'Next': () => {
			setIndex(p => (p + 1) % texts.length);
		},
		'Null': () => {
			setIndex(-1);
		}
	});

	return (
		<>
			{buttonsRender}
			<TextTopContainer>
				<SwitchTransition transitionKey={text} timing={timing}>
					<TextTransitionContainer>
						<div>{text}</div>
					</TextTransitionContainer>
				</SwitchTransition>
			</TextTopContainer>
		</>
	);
});

const TransitionSelectors = createClassSelectors({ useAmpersandPrefix: true });

const texts = [
	"Somebody Told Me",
	"Mr. Brightside",
	"Why Do I Keep Counting?",
	"For Reasons Unknown",
	"Flesh And Bone"
];

const TextTopContainer = styled.div`
	width: 15rem;
	height: 5rem;
	background-color: #333;
	color: white;
	position: relative;
	box-sizing: border-box;
	font-weight: bold;
`;

const TextTransitionContainer = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
	padding: 1rem;
	box-sizing: border-box;
	

	${TransitionSelectors.inactive} {
		opacity: 0;
	}
	${TransitionSelectors.active} {
		opacity: 1;
	}
	${TransitionSelectors.transitioning} {
		transition: opacity .5s;
	}
`;
