import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const asyncStorageMock = vi.hoisted(() => ({
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: asyncStorageMock,
}));

vi.mock('../lib/review-prompt', () => ({
  reviewPrompt: {
    incrementMoodEntries: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock('../lib/wellness-reminders', () => ({
  wellnessReminders: {
    checkAndNotify: vi.fn().mockResolvedValue(undefined),
  },
}));

import { moodTracker } from '../lib/mood-tracker';

describe('MoodTracker stats caching', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));
    asyncStorageMock.getItem.mockResolvedValue(null);
    asyncStorageMock.setItem.mockResolvedValue(undefined);
    asyncStorageMock.removeItem.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('reuses cached stats within the cache window', async () => {
    const moods = [
      {
        id: 'mood_1',
        timestamp: Date.now() - 1000,
        moodLevel: 7,
        emotions: ['joyful'],
      },
    ];

    asyncStorageMock.getItem.mockResolvedValue(JSON.stringify(moods));

    const first = await moodTracker.getMoodStats(30);
    const second = await moodTracker.getMoodStats(30);

    expect(asyncStorageMock.getItem).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('invalidates cached stats after logging a mood', async () => {
    const moods = [
      {
        id: 'mood_1',
        timestamp: Date.now() - 1000,
        moodLevel: 4,
        emotions: ['down'],
      },
    ];

    asyncStorageMock.getItem.mockResolvedValue(JSON.stringify(moods));
    await moodTracker.getMoodStats(30);

    asyncStorageMock.getItem.mockClear();
    asyncStorageMock.getItem.mockResolvedValue(JSON.stringify(moods));
    await moodTracker.logMood({
      moodLevel: 6,
      emotions: ['content'],
    });

    const updatedMoods = [
      ...moods,
      {
        id: 'mood_new',
        timestamp: Date.now(),
        moodLevel: 6,
        emotions: ['content'],
      },
    ];

    asyncStorageMock.getItem.mockClear();
    asyncStorageMock.getItem.mockResolvedValue(JSON.stringify(updatedMoods));

    const updatedStats = await moodTracker.getMoodStats(30);

    expect(asyncStorageMock.getItem).toHaveBeenCalledTimes(1);
    expect(updatedStats.totalEntries).toBe(2);
    expect(updatedStats.averageMood).toBe(5);
  });
});
