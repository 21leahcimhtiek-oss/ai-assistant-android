import React, { useState, useEffect } from 'react';
import { ScrollView, View, Text, Pressable, Linking } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { CrossAppLinkingService, TherapyApp } from '../../cross-app-linking';

export default function LinkedAppsScreen() {
  const [linkedApps, setLinkedApps] = useState<TherapyApp[]>([]);
  const [recommendedApps, setRecommendedApps] = useState<TherapyApp[]>([]);
  const [allApps, setAllApps] = useState<TherapyApp[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadApps();
  }, []);

  const loadApps = async () => {
    try {
      const linked = await CrossAppLinkingService.getLinkedApps();
      const recommended = await CrossAppLinkingService.getRecommendedApps('traumaheal');
      const all = CrossAppLinkingService.getAllApps();

      setLinkedApps(linked);
      setRecommendedApps(recommended);
      setAllApps(all);
    } catch (error) {
      console.error('Error loading apps:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLinkApp = async (app: TherapyApp) => {
    try {
      await CrossAppLinkingService.linkTherapyApp('user-id', app.id);
      loadApps();
    } catch (error) {
      console.error('Error linking app:', error);
    }
  };

  const handleUnlinkApp = async (app: TherapyApp) => {
    try {
      await CrossAppLinkingService.unlinkTherapyApp('user-id', app.id);
      loadApps();
    } catch (error) {
      console.error('Error unlinking app:', error);
    }
  };

  const handleOpenApp = (app: TherapyApp) => {
    if (app.installed) {
      Linking.openURL(app.deepLink).catch(err =>
        console.error('Error opening app:', err)
      );
    }
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="p-6 gap-6">
          {/* Header */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-2xl font-bold text-foreground mb-2">
              Therapy App Suite
            </Text>
            <Text className="text-sm text-muted">
              Link apps for unified mental health support
            </Text>
          </View>

          {/* Linked Apps */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-foreground">
                Linked Apps
              </Text>
              <View className="bg-primary/20 rounded-full px-3 py-1">
                <Text className="text-xs font-semibold text-primary">
                  {linkedApps.length}
                </Text>
              </View>
            </View>

            {linkedApps.length === 0 ? (
              <View className="p-4 bg-background rounded-lg border border-border">
                <Text className="text-sm text-muted text-center">
                  No apps linked yet. Start by linking MindSpace below.
                </Text>
              </View>
            ) : (
              <View className="gap-3">
                {linkedApps.map(app => (
                  <View
                    key={app.id}
                    className="bg-background rounded-xl p-4 border border-primary flex-row justify-between items-center"
                  >
                    <View className="flex-1">
                      <View className="flex-row items-center gap-3 mb-1">
                        <Text style={{ fontSize: 24 }}>{app.icon}</Text>
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-foreground">
                            {app.name}
                          </Text>
                          <Text className="text-xs text-muted mt-1">
                            {app.description}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View className="flex-row gap-2">
                      {app.installed && (
                        <Pressable
                          onPress={() => handleOpenApp(app)}
                          className="bg-primary rounded-lg px-4 py-2 active:opacity-80"
                        >
                          <Text className="text-xs font-semibold text-background">
                            Open
                          </Text>
                        </Pressable>
                      )}

                      <Pressable
                        onPress={() => handleUnlinkApp(app)}
                        className="bg-error/20 rounded-lg px-4 py-2 border border-error active:opacity-80"
                      >
                        <Text className="text-xs font-semibold text-error">
                          Unlink
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Recommended Apps */}
          {recommendedApps.length > 0 && (
            <View className="bg-surface rounded-2xl p-6 border border-border">
              <Text className="text-lg font-semibold text-foreground mb-4">
                Recommended for You
              </Text>

              <View className="gap-3">
                {recommendedApps.map(app => (
                  <View
                    key={app.id}
                    className="bg-background rounded-xl p-4 border border-border"
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1 flex-row items-center gap-3">
                        <Text style={{ fontSize: 24 }}>{app.icon}</Text>
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-foreground">
                            {app.name}
                          </Text>
                          <Text className="text-xs text-muted mt-1">
                            {app.description}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleLinkApp(app)}
                      className="bg-primary rounded-lg p-3 active:opacity-80"
                    >
                      <Text className="text-center text-background font-semibold text-sm">
                        Link App
                      </Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* All Available Apps */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">
              All Therapy Apps
            </Text>

            <View className="gap-3">
              {allApps.map(app => {
                const isLinked = linkedApps.some(a => a.id === app.id);

                return (
                  <View
                    key={app.id}
                    className="bg-background rounded-xl p-4 border border-border"
                  >
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-1 flex-row items-center gap-3">
                        <Text style={{ fontSize: 24 }}>{app.icon}</Text>
                        <View className="flex-1">
                          <Text className="text-base font-semibold text-foreground">
                            {app.name}
                          </Text>
                          <Text className="text-xs text-muted mt-1">
                            {app.description}
                          </Text>
                        </View>
                      </View>

                      {isLinked && (
                        <View className="bg-success/20 rounded-full px-2 py-1">
                          <Text className="text-xs font-semibold text-success">
                            ✓ Linked
                          </Text>
                        </View>
                      )}
                    </View>

                    <View className="flex-row gap-2">
                      {!isLinked && (
                        <Pressable
                          onPress={() => handleLinkApp(app)}
                          className="flex-1 bg-primary rounded-lg p-3 active:opacity-80"
                        >
                          <Text className="text-center text-background font-semibold text-sm">
                            Link
                          </Text>
                        </Pressable>
                      )}

                      {isLinked && app.installed && (
                        <Pressable
                          onPress={() => handleOpenApp(app)}
                          className="flex-1 bg-primary rounded-lg p-3 active:opacity-80"
                        >
                          <Text className="text-center text-background font-semibold text-sm">
                            Open
                          </Text>
                        </Pressable>
                      )}

                      {isLinked && !app.installed && (
                        <View className="flex-1 bg-muted/20 rounded-lg p-3">
                          <Text className="text-center text-muted font-semibold text-sm">
                            Not Installed
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Data Sharing Info */}
          <View className="bg-primary/10 rounded-2xl p-6 border border-primary/30">
            <Text className="text-lg font-semibold text-foreground mb-3">
              Data Sharing
            </Text>

            <View className="gap-2">
              <Text className="text-sm text-muted">
                • Linked apps can share mood, progress, and session data
              </Text>
              <Text className="text-sm text-muted">
                • You control which data is shared with each app
              </Text>
              <Text className="text-sm text-muted">
                • All data is encrypted and HIPAA-compliant
              </Text>
              <Text className="text-sm text-muted">
                • Unlink apps anytime to stop data sharing
              </Text>
            </View>
          </View>

          {/* Benefits */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Benefits of Linking
            </Text>

            <View className="gap-3">
              <View className="flex-row gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/20 justify-center items-center">
                  <Text className="text-xs font-bold text-primary">1</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Unified Progress Tracking
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    See all your mental health progress in one place
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/20 justify-center items-center">
                  <Text className="text-xs font-bold text-primary">2</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Personalized Recommendations
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Get app suggestions based on your therapy needs
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/20 justify-center items-center">
                  <Text className="text-xs font-bold text-primary">3</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Holistic Therapy
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Address multiple mental health issues simultaneously
                  </Text>
                </View>
              </View>

              <View className="flex-row gap-3">
                <View className="w-8 h-8 rounded-full bg-primary/20 justify-center items-center">
                  <Text className="text-xs font-bold text-primary">4</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">
                    Therapist Coordination
                  </Text>
                  <Text className="text-xs text-muted mt-1">
                    Share data with your therapist across all apps
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
