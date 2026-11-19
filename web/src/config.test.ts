import { describe, expect, it, vi } from 'vitest';
import { parseRefreshInterval } from './config';

describe('parseRefreshInterval', () => {
  it('defaults to 15 s when not set', () => {
    expect(parseRefreshInterval(undefined)).toBe(15_000);
    expect(parseRefreshInterval('')).toBe(15_000);
  });

  it('uses a valid value', () => {
    expect(parseRefreshInterval('5000')).toBe(5_000);
  });

  it.each(['abc', '500', '2.5', '-1'])('falls back to the default and warns for "%s"', (raw) => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(parseRefreshInterval(raw)).toBe(15_000);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });
});
