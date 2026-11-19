import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';

// Placeholder UI; the dashboard arrives in phase 4.
const root = document.getElementById('root');
if (!root) throw new Error('Root element #root not found');

createRoot(root).render(
  <StrictMode>
    <CssBaseline />
    <Typography variant="h5" component="h1" sx={{ p: 3 }}>
      Service Status
    </Typography>
  </StrictMode>,
);
