import type { SxProps, Theme } from '@mui/material/styles';

/**
 * Hides content visually while keeping it available to screen readers.
 * Sizes are strings on purpose: in MUI's `sx`, numbers between 0 and 1 mean percentages
 * (`width: 1` is 100%) and margins use the spacing scale (`margin: -1` is -8px).
 */
export const visuallyHidden: SxProps<Theme> = {
  border: 0,
  clip: 'rect(0 0 0 0)',
  clipPath: 'inset(50%)',
  height: '1px',
  width: '1px',
  margin: '-1px',
  padding: 0,
  overflow: 'hidden',
  position: 'absolute',
  whiteSpace: 'nowrap',
};
