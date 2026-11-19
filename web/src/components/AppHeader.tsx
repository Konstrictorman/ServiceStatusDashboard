import MonitorHeart from '@mui/icons-material/MonitorHeart';
import Refresh from '@mui/icons-material/Refresh';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Toolbar from '@mui/material/Toolbar';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { formatRelative } from '../lib/time';

interface AppHeaderProps {
  /** Time of the last successful refresh (ms), or null before the first one. */
  lastUpdatedAt: number | null;
  now: number;
  onRefresh: () => void;
  refreshing: boolean;
}

export function AppHeader({ lastUpdatedAt, now, onRefresh, refreshing }: AppHeaderProps) {
  const updated = lastUpdatedAt ? `Last updated ${formatRelative(lastUpdatedAt, now)}` : 'Loading…';
  return (
    <AppBar position="static">
      <Toolbar>
        <MonitorHeart sx={{ mr: 1.5 }} aria-hidden />
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h6" component="h1">
            Service Status
          </Typography>
          <Typography variant="caption" sx={{ display: { xs: 'block', sm: 'none' }, opacity: 0.8 }}>
            {updated}
          </Typography>
        </Box>
        <Typography
          variant="body2"
          sx={{ display: { xs: 'none', sm: 'block' }, opacity: 0.8, mr: 1 }}
        >
          {updated}
        </Typography>
        <Tooltip title="Refresh">
          <IconButton
            color="inherit"
            aria-label="Refresh status"
            onClick={onRefresh}
            loading={refreshing}
          >
            <Refresh />
          </IconButton>
        </Tooltip>
      </Toolbar>
    </AppBar>
  );
}
