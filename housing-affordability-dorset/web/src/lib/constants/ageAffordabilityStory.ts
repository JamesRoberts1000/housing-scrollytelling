/** Scroll-step choreography for Section 6 (age vs affordability). */
export const SHOW_TRENDLINE = 1;
export const SHOW_OLDER_HIGH_RATIO = 2;
export const SHOW_YOUNGER_AFFORDABLE = 3;
export const SHOW_BELOW_EIGHT_YOUNGER = 4;

/** Affordability ratio threshold for “more affordable” neighbourhoods in step 4. */
export const RATIO_BELOW_AFFORDABLE_THRESHOLD = 8;

export const POINT_FILL = '#5C6B7A';
export const HIGHLIGHT_POINT_FILL = '#0b0c0c';
export const TRENDLINE_STROKE = '#8A8A8A';
export const DORSET_AVERAGE_STROKE = '#0b0c0c';

/** High ratio + older population. */
export const OLDER_HIGH_RATIO_CODES = ['E02004246', 'E02004273', 'E02004267'] as const;

/** Younger or moderate age + lower ratios (Portland via Southwell & Weston). */
export const YOUNGER_AFFORDABLE_CODES = ['E02004288', 'E02004284', 'E02004289'] as const;
