import BasePart from './switch-transition.fixture-base';
import TextFadePart from './switch-transition.fixture-text-fade';
import PanelSlidePart from './switch-transition.fixture-panel-slide';
import MultiStagePart from './switch-transition.fixture-multi-stage';
import PanelSwapPart from './switch-transition.fixture-panel-swap';
import EnterFirstPart from './switch-transition.fixture-enter-first';
import ExitFirstPart from './switch-transition.fixture-exit-first';

export default {
	'Base': BasePart,
	'Enter First': EnterFirstPart,
	'Exit First': ExitFirstPart,
	'Multi Stage': MultiStagePart,
	'Panel Slide': PanelSlidePart,
	'Panel Swap': PanelSwapPart,
	'Text Fade': TextFadePart,
};