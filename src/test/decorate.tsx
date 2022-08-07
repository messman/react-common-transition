import * as React from 'react';
import { ThemeProvider } from 'styled-components';
import { styled } from './styled';
import { lightTheme } from './theme';

export function wrap(Component: React.FC): React.FC {
	return () => {
		return (
			<TestWrapper>
				<Component />
			</TestWrapper>
		);
	};
}

export const TestWrapper: React.FC<React.PropsWithChildren> = (props) => {

	return (
		<ThemeProvider theme={lightTheme}>
			{props.children}
		</ThemeProvider>
	);
};

export interface TestButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {

}

export const TestButton: React.FC<TestButtonProps> = (props) => {
	return (
		<InnerTestButton {...props} />
	);
};

const InnerTestButton = styled.button`
	display: block;
	border-radius: .5rem;
	background-color: ${p => p.theme.color.backgroundSecondary};
	color: ${p => p.theme.color.text};
	border: 1px solid ${p => p.theme.color.text};
	cursor: pointer;
	padding: .5rem 1.5rem;
	margin: .5rem;

	:hover {
		background-color: ${p => p.theme.color.backgroundSecondary};
		border-color: blue;
	}
	:active {
		background-color: ${p => p.theme.color.backgroundTertiary};
	}
`;

export function useTestButton(title: string, onClick: () => void): JSX.Element {
	return <TestButton onClick={onClick}>{title}</TestButton>;
}

export type ButtonSetDefinition = { [key: string]: () => void; };

export function useTestButtons(buttonSetDefinition: ButtonSetDefinition): JSX.Element {

	const keys = Object.keys(buttonSetDefinition);
	const buttons = keys.map<JSX.Element>((key) => {
		const value = buttonSetDefinition[key];
		return <TestButton key={key} onClick={value}>{key}</TestButton>;
	});

	return (
		<InnerTestButtonSet>
			{buttons}
		</InnerTestButtonSet>
	);
}

const InnerTestButtonSet = styled.div`
	display: flex;
	flex-direction: flex-start;
	flex-wrap: wrap;
	margin: .5rem;
`;