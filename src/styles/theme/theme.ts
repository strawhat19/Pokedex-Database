export type ThemeName = `light` | `dark`;
export interface ThemePalette {
  red: string;
  text: string;
  muted: string;
  green: string;
  border: string;
  surface: string;
  background: string;
  surfaceAlt: string;
}

export const themePalettes: Record<ThemeName, ThemePalette> = {
  light: {
    red: `#ed493b`,
    text: `#18231e`,
    muted: `#6b786f`,
    green: `#b9e5b2`,
    border: `#dfe7de`,
    surface: `#ffffff`,
    background: `#f7faf5`,
    surfaceAlt: `#edf4e9`,
  },
  dark: {
    red: `#f56859`,
    text: `#ecf4e9`,
    muted: `#9aab9f`,
    green: `#8acb85`,
    border: `#31453a`,
    surface: `#1c2b23`,
    background: `#131e18`,
    surfaceAlt: `#25392c`,
  },
};
