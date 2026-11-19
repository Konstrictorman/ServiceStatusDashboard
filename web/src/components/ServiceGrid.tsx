import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import { compareBySeverity, type ServiceStatus } from '@ssd/shared';
import { visuallyHidden } from '../lib/a11y';
import { ServiceCard, ServiceCardSkeleton } from './ServiceCard';

const SKELETON_COUNT = 5;
const cardSize = { xs: 12, sm: 6, md: 4 } as const;

interface ServiceGridProps {
  services: readonly ServiceStatus[];
  loading: boolean;
  now: number;
}

/** Problems first (down, degraded, unknown), so operators see them without scanning. */
export function ServiceGrid({ services, loading, now }: ServiceGridProps) {
  const sorted = [...services].sort(compareBySeverity);
  return (
    <Box component="section" aria-labelledby="services-heading">
      <Typography id="services-heading" component="h2" sx={visuallyHidden}>
        Services
      </Typography>
      <Grid container spacing={2}>
        {loading
          ? Array.from({ length: SKELETON_COUNT }, (_, i) => (
              <Grid key={i} size={cardSize}>
                <ServiceCardSkeleton />
              </Grid>
            ))
          : sorted.map((service) => (
              <Grid key={service.id} size={cardSize}>
                <ServiceCard service={service} now={now} />
              </Grid>
            ))}
      </Grid>
    </Box>
  );
}
