# react-common-transition

_**Not stable. Not recommended for use by anyone other than the creator. I will likely not respond to feature requests.**_

`npm install --save @messman/react-common-transition`

View on [npm](https://www.npmjs.com/package/@messman/react-common-transition) or on [GitHub](https://github.com/messman/react-common-transition).

Common transition tools for React. As noted below, this is a fork of `react-transition-group`.

## react-transition-group

This project is a fork of [React's react-transition-group](https://github.com/reactjs/react-transition-group) from December 2021. This project retains the BSD 3-Clause License from that project.

This fork was created for the following reasons:
- Experiment with using React hooks instead of class components
- Make changes to the API for simplicity and to better support working with `styled-components`
- Retain the BSD 3-Clause License for modifications of the transition implementation

Changes made:
- Re-implemented the logic from `CSSTransition` and `Transition` in a new hooks-based `Transition` component that has fewer input props and requires a `ref` to the transitioning child component
- Removed all other components
- Removed former build and deploy code and added more familiar build and deploy code

This fork, while public, is generally not open for issues or feature requests.

Relevant documentation from that project:

> A set of components for managing component states (including mounting and unmounting) over time, specifically designed with animation in mind.
> [**Main documentation**](https://reactcommunity.org/react-transition-group/)