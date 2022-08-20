import * as React from 'react';
import { useTestButtons, wrap } from '@/test/decorate';
import { createClassSelectors } from './transition';
import { styled } from '@/test/styled';
import { SwitchTransition } from './switch-transition';

export default wrap(() => {
	const [index, setIndex] = React.useState(0);
	const text = texts[index];

	const buttonsRender = useTestButtons({
		'Next': () => {
			setIndex(p => (p + 1) % texts.length);
		}
	});

	return (
		<>
			{buttonsRender}
			<TextTopContainer>
				<SwitchTransition transitionKey={text}>
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
		transition: opacity 1s;
	}
`;
