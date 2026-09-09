import { createStore } from './store';
import { getTheme, type Theme } from './storage';

export type { Theme };

export const themeStore = createStore<Theme>(getTheme());
