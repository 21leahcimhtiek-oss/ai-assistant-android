import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const asyncStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: asyncStorageMock,
}));

import { torService } from '../lib/tor-service';

const TOR_LOGS_KEY = '@ai_assistant_tor_logs';

describe('TorService log persistence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    asyncStorageMock.getItem.mockResolvedValue(null);
    asyncStorageMock.setItem.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('batches log writes when multiple logs are added rapidly', async () => {
    await torService.clearLogs();
    asyncStorageMock.setItem.mockClear();

    await torService.enable();
    await torService.newCircuit();

    await vi.runAllTimersAsync();

    const logWrites = asyncStorageMock.setItem.mock.calls.filter(
      ([key]) => key === TOR_LOGS_KEY
    );

    expect(logWrites).toHaveLength(1);

    const savedLogs = JSON.parse(logWrites[0][1]);
    expect(savedLogs.some((log: { message: string }) => log.message === 'Attempting to connect to Tor network...')).toBe(true);
    expect(savedLogs.some((log: { message: string }) => log.message === 'New Tor circuit established')).toBe(true);
  });
});
