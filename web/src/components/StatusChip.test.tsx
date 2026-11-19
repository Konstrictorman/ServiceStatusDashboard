import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import type { ServiceStatusValue } from '@ssd/shared';
import { renderWithProviders } from '../test/render';
import { StatusChip } from './StatusChip';

describe('StatusChip', () => {
  it.each<[ServiceStatusValue, string, string]>([
    ['operational', 'Operational', 'CheckCircleOutlinedIcon'],
    ['degraded', 'Degraded', 'WarningAmberIcon'],
    ['down', 'Down', 'ErrorOutlinedIcon'],
    ['unknown', 'Unknown', 'HelpOutlinedIcon'],
  ])('shows an icon and the text label for %s (never color alone)', (status, label, iconTestId) => {
    renderWithProviders(<StatusChip status={status} />);
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.getByTestId(iconTestId)).toBeInTheDocument();
  });
});
