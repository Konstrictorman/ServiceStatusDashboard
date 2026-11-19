import { createTheme } from '@mui/material/styles';

declare module '@mui/material/styles' {
  interface Palette {
    unknown: Palette['primary'];
  }
  interface PaletteOptions {
    unknown?: PaletteOptions['primary'];
  }
}
declare module '@mui/material/Alert' {
  interface AlertPropsColorOverrides {
    unknown: true;
  }
}
declare module '@mui/material/Chip' {
  interface ChipPropsColorOverrides {
    unknown: true;
  }
}

const base = createTheme();

/**
 * MUI defaults plus a grey "unknown" palette entry (MUI has no grey severity).
 * Colors match the "MUI theme palette" variables in the Figma file.
 */
export const theme = createTheme({
  palette: {
    background: { default: '#F5F5F5' },
    unknown: base.palette.augmentColor({ color: { main: '#757575' }, name: 'unknown' }),
  },
  components: {
    MuiCard: { defaultProps: { elevation: 1 } },
  },
});
