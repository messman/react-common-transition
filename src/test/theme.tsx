import { createGlobalStyle, ThemeProps } from 'styled-components';

/** Custom application theme type. */
export interface Theme {
	name: string,
	color: {
		background: string,
		backgroundSecondary: string,
		backgroundTertiary: string,
		text: string,
	};
	fontFamily: string;
}

/** The light theme */
export const lightTheme: Theme = {
	name: 'light',
	color: {
		// Overrides
		background: '#FEFCFB',
		backgroundSecondary: '#F0F0F0',
		backgroundTertiary: '#DDDDDD',
		text: '#1B1B1B',
	},
	fontFamily: `'Work Sans', sans-serif;`
};

// Note: '#root' is for testing
// Note: overscroll-behavior comes from https://stackoverflow.com/a/50846937 to prevent macs going back (since we have horizontal scroll)
export const GlobalStyles = createGlobalStyle<ThemeProps<Theme>>`
	html {
		font-family: ${p => p.theme.fontFamily};
		font-weight: 400;
	}
	
	body {
		background-color: ${p => p.theme.color.background};
		color: ${p => p.theme.color.text};
	}

	html, body, #react-root, #root {
		margin: 0;
		padding: 0;
		height: 100%;

		overscroll-behavior: none;
	}

	* {
		font-weight: 400;
		vertical-align: top;
		-webkit-text-size-adjust: 100%;
		box-sizing: border-box;
	}
`;