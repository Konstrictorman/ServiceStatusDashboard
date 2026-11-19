import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import { useMemo } from 'react';
import { useEvents, useServices } from './api/queries';
import { AppHeader } from './components/AppHeader';
import { ConnectionAlert } from './components/ConnectionAlert';
import { EventsTable } from './components/EventsTable';
import { LiveAnnouncer } from './components/LiveAnnouncer';
import { OverallStatusAlert, OverallStatusSkeleton } from './components/OverallStatusAlert';
import { ServiceGrid } from './components/ServiceGrid';
import { isClientStale, markAllUnknown } from './lib/stale';
import { useNow } from './lib/time';

export function App() {
  const services = useServices();
  const events = useEvents();
  const now = useNow();

  const stale = isClientStale({
    isError: services.isError,
    updatedAt: services.dataUpdatedAt,
    now,
  });
  const view = useMemo(
    () => (services.data && stale ? markAllUnknown(services.data) : services.data),
    [services.data, stale],
  );

  const refresh = () => {
    void services.refetch();
    void events.refetch();
  };

  return (
    <>
      <AppHeader
        lastUpdatedAt={services.dataUpdatedAt || null}
        now={now}
        onRefresh={refresh}
        refreshing={services.isFetching}
      />
      <Container component="main" maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        <Stack spacing={{ xs: 2, sm: 3 }}>
          {services.isError && (
            <ConnectionAlert
              error={services.error}
              hasData={services.data !== undefined}
              lastUpdatedAt={services.dataUpdatedAt}
              now={now}
              onRetry={refresh}
              retrying={services.isFetching}
            />
          )}
          {view ? (
            <OverallStatusAlert overall={view.overall} services={view.services} />
          ) : (
            services.isPending && <OverallStatusSkeleton />
          )}
          <ServiceGrid services={view?.services ?? []} loading={services.isPending} now={now} />
          <EventsTable
            events={events.data?.events}
            loading={events.isPending}
            error={events.error}
          />
        </Stack>
        {view && <LiveAnnouncer services={view.services} />}
      </Container>
    </>
  );
}
