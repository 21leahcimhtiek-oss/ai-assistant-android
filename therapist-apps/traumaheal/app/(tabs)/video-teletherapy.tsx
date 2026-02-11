import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, TextInput, FlatList } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  VideoTeletherapyService,
  Therapist,
  VideoSession,
} from '../../video-teletherapy-service';

export default function VideoTeletherapyScreen() {
  const [tab, setTab] = useState<'browse' | 'upcoming' | 'past'>('browse');
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<VideoSession[]>([]);
  const [pastSessions, setPastSessions] = useState<VideoSession[]>([]);
  const [selectedTherapist, setSelectedTherapist] = useState<Therapist | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedSessions: 0,
    upcomingSessions: 0,
    totalSpent: 0,
    averageRating: 0,
  });

  useEffect(() => {
    loadData();
  }, [tab]);

  const loadData = async () => {
    try {
      if (tab === 'browse') {
        const list = await VideoTeletherapyService.getAvailableTherapists();
        setTherapists(list);
      } else if (tab === 'upcoming') {
        const sessions = await VideoTeletherapyService.getUpcomingSessions();
        setUpcomingSessions(sessions);
      } else {
        const sessions = await VideoTeletherapyService.getPastSessions();
        setPastSessions(sessions);
      }

      const statistics = await VideoTeletherapyService.getSessionStatistics();
      setStats(statistics);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      const results = await VideoTeletherapyService.searchTherapists(searchQuery);
      setTherapists(results);
    } else {
      loadData();
    }
  };

  const handleBookSession = async (therapist: Therapist) => {
    setSelectedTherapist(therapist);
  };

  const handleCancelSession = async (sessionId: string) => {
    try {
      await VideoTeletherapyService.cancelSession(sessionId, 'Cancelled by user');
      loadData();
    } catch (error) {
      console.error('Error cancelling session:', error);
    }
  };

  return (
    <ScreenContainer className="p-0 flex-col">
      {/* Header */}
      <View className="bg-primary/10 border-b border-border p-4">
        <Text className="text-2xl font-bold text-foreground">Video Teletherapy</Text>
        <Text className="text-sm text-muted mt-1">Connect with professional therapists</Text>
      </View>

      {/* Statistics */}
      <View className="bg-surface border-b border-border p-4">
        <View className="flex-row gap-4">
          <View className="flex-1 bg-background rounded-lg p-3">
            <Text className="text-2xl font-bold text-primary">{stats.totalSessions}</Text>
            <Text className="text-xs text-muted mt-1">Total Sessions</Text>
          </View>
          <View className="flex-1 bg-background rounded-lg p-3">
            <Text className="text-2xl font-bold text-success">{stats.completedSessions}</Text>
            <Text className="text-xs text-muted mt-1">Completed</Text>
          </View>
          <View className="flex-1 bg-background rounded-lg p-3">
            <Text className="text-2xl font-bold text-warning">{stats.upcomingSessions}</Text>
            <Text className="text-xs text-muted mt-1">Upcoming</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View className="flex-row border-b border-border bg-background">
        {(['browse', 'upcoming', 'past'] as const).map(tabName => (
          <Pressable
            key={tabName}
            onPress={() => setTab(tabName)}
            className={`flex-1 py-4 border-b-2 ${
              tab === tabName ? 'border-primary' : 'border-transparent'
            }`}
          >
            <Text
              className={`text-center text-sm font-semibold ${
                tab === tabName ? 'text-primary' : 'text-muted'
              }`}
            >
              {tabName === 'browse' ? 'Browse Therapists' : tabName === 'upcoming' ? 'Upcoming' : 'Past Sessions'}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-4">
        {tab === 'browse' && (
          <View className="gap-4">
            {/* Search */}
            <View className="flex-row gap-2">
              <TextInput
                placeholder="Search therapists..."
                placeholderTextColor="#687076"
                value={searchQuery}
                onChangeText={setSearchQuery}
                className="flex-1 bg-surface border border-border rounded-lg p-3 text-foreground"
              />
              <Pressable
                onPress={handleSearch}
                className="bg-primary rounded-lg px-4 justify-center active:opacity-80"
              >
                <Text className="text-background font-semibold">🔍</Text>
              </Pressable>
            </View>

            {/* Therapist List */}
            {therapists.map(therapist => (
              <View key={therapist.id} className="bg-surface rounded-2xl p-4 border border-border">
                <View className="flex-row justify-between items-start mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-foreground">
                      {therapist.name}
                    </Text>
                    <Text className="text-xs text-primary mt-1">
                      {therapist.specialization.join(', ')}
                    </Text>
                  </View>
                  {therapist.verified && (
                    <View className="bg-success/20 rounded-full px-2 py-1">
                      <Text className="text-xs font-semibold text-success">✓ Verified</Text>
                    </View>
                  )}
                </View>

                <View className="flex-row gap-3 mb-3">
                  <View className="flex-1">
                    <Text className="text-xs text-muted">Rating</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      ⭐ {therapist.rating} ({therapist.reviewCount})
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted">Experience</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      {therapist.yearsExperience} years
                    </Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-xs text-muted">Rate</Text>
                    <Text className="text-sm font-semibold text-foreground">
                      ${therapist.hourlyRate}/hr
                    </Text>
                  </View>
                </View>

                <Text className="text-sm text-muted mb-3">{therapist.bio}</Text>

                <Pressable
                  onPress={() => handleBookSession(therapist)}
                  className="bg-primary rounded-lg p-3 active:opacity-80"
                >
                  <Text className="text-center text-background font-semibold">
                    Book Session
                  </Text>
                </Pressable>
              </View>
            ))}
          </View>
        )}

        {tab === 'upcoming' && (
          <View className="gap-4">
            {upcomingSessions.length === 0 ? (
              <View className="bg-surface rounded-xl p-6 border border-border text-center">
                <Text className="text-muted text-center">No upcoming sessions scheduled</Text>
              </View>
            ) : (
              upcomingSessions.map(session => (
                <View key={session.id} className="bg-surface rounded-2xl p-4 border border-border">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground">
                        {session.therapistName}
                      </Text>
                      <Text className="text-xs text-primary mt-1">
                        {new Date(session.scheduledTime).toLocaleString()}
                      </Text>
                    </View>
                    <View className="bg-warning/20 rounded-full px-2 py-1">
                      <Text className="text-xs font-semibold text-warning">Scheduled</Text>
                    </View>
                  </View>

                  <View className="flex-row gap-3 mb-3">
                    <View className="flex-1">
                      <Text className="text-xs text-muted">Duration</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        {session.duration} min
                      </Text>
                    </View>
                    <View className="flex-1">
                      <Text className="text-xs text-muted">Cost</Text>
                      <Text className="text-sm font-semibold text-foreground">
                        ${session.cost.toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    <Pressable className="flex-1 bg-primary rounded-lg p-3 active:opacity-80">
                      <Text className="text-center text-background font-semibold text-sm">
                        Join Call
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => handleCancelSession(session.id)}
                      className="flex-1 bg-error/20 rounded-lg p-3 border border-error active:opacity-80"
                    >
                      <Text className="text-center text-error font-semibold text-sm">
                        Cancel
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {tab === 'past' && (
          <View className="gap-4">
            {pastSessions.length === 0 ? (
              <View className="bg-surface rounded-xl p-6 border border-border">
                <Text className="text-muted text-center">No completed sessions yet</Text>
              </View>
            ) : (
              pastSessions.map(session => (
                <View key={session.id} className="bg-surface rounded-2xl p-4 border border-border">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground">
                        {session.therapistName}
                      </Text>
                      <Text className="text-xs text-muted mt-1">
                        {new Date(session.scheduledTime).toLocaleDateString()}
                      </Text>
                    </View>
                    {session.rating && (
                      <View className="bg-success/20 rounded-full px-2 py-1">
                        <Text className="text-xs font-semibold text-success">
                          ⭐ {session.rating}/5
                        </Text>
                      </View>
                    )}
                  </View>

                  {session.feedback && (
                    <View className="bg-background rounded-lg p-3 mb-3">
                      <Text className="text-xs font-semibold text-foreground mb-1">
                        Your Feedback
                      </Text>
                      <Text className="text-xs text-muted">{session.feedback}</Text>
                    </View>
                  )}

                  <Pressable className="bg-primary/20 rounded-lg p-3 border border-primary active:opacity-80">
                    <Text className="text-center text-primary font-semibold text-sm">
                      View Recording
                    </Text>
                  </Pressable>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Footer Stats */}
      <View className="bg-surface border-t border-border p-4">
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-xs text-muted">Total Spent</Text>
            <Text className="text-lg font-bold text-foreground">
              ${stats.totalSpent.toFixed(2)}
            </Text>
          </View>
          <View className="text-right">
            <Text className="text-xs text-muted">Avg Rating</Text>
            <Text className="text-lg font-bold text-foreground">
              ⭐ {stats.averageRating.toFixed(1)}
            </Text>
          </View>
        </View>
      </View>
    </ScreenContainer>
  );
}
