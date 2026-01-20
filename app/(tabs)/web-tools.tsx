import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Switch, TouchableOpacity, Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { webScraper, ProxyConfig } from '@/lib/web-scraper';
import { torService } from '@/lib/tor-service';

export default function WebToolsScreen() {
  const colors = useColors();
  const [proxyEnabled, setProxyEnabled] = useState(false);
  const [torEnabled, setTorEnabled] = useState(false);
  const [currentIP, setCurrentIP] = useState('Loading...');
  const [proxyList, setProxyList] = useState<ProxyConfig[]>([]);
  const [torConnected, setTorConnected] = useState(false);

  useEffect(() => {
    loadSettings();
    fetchCurrentIP();
  }, []);

  const loadSettings = async () => {
    const proxies = webScraper.getProxyList();
    setProxyList(proxies);
    setProxyEnabled(proxies.some(p => p.active));
    
    const torStatus = torService.isEnabled();
    setTorEnabled(torStatus);
    setTorConnected(torService.isConnected());
  };

  const fetchCurrentIP = async () => {
    try {
      const ip = await webScraper.getCurrentIP();
      setCurrentIP(ip);
    } catch (error) {
      setCurrentIP('Unable to fetch');
    }
  };

  const handleProxyToggle = async (value: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (value && proxyList.length === 0) {
      Alert.alert(
        'No Proxies Configured',
        'You need to add proxy servers before enabling proxy rotation. Would you like to add one now?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add Proxy', onPress: () => showAddProxyDialog() },
        ]
      );
      return;
    }

    setProxyEnabled(value);
    
    if (value) {
      // Enable first proxy
      if (proxyList.length > 0 && !proxyList[0].active) {
        await webScraper.toggleProxy(0);
        await loadSettings();
      }
    } else {
      // Disable all proxies
      for (let i = 0; i < proxyList.length; i++) {
        if (proxyList[i].active) {
          await webScraper.toggleProxy(i);
        }
      }
      await loadSettings();
    }
  };

  const handleTorToggle = async (value: boolean) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (value) {
      Alert.alert(
        'Enable Tor Network',
        'This will route your requests through the Tor network for anonymity. Connection may be slower.\n\nNote: Requires Tor to be installed and running on your device.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Enable',
            onPress: async () => {
              const success = await torService.enable();
              if (success) {
                setTorEnabled(true);
                setTorConnected(true);
                if (Platform.OS !== 'web') {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
              } else {
                Alert.alert('Connection Failed', 'Unable to connect to Tor network. Make sure Tor is installed and running.');
              }
            },
          },
        ]
      );
    } else {
      await torService.disable();
      setTorEnabled(false);
      setTorConnected(false);
    }
  };

  const showAddProxyDialog = () => {
    Alert.alert(
      'Add Proxy',
      'Proxy configuration requires manual setup. Add proxy details in the format:\n\nhost:port\n\nExample: proxy.example.com:8080',
      [{ text: 'OK' }]
    );
  };

  const testConnection = async () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    Alert.alert('Testing Connection', 'Fetching current IP address...');
    await fetchCurrentIP();
    
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const newTorCircuit = async () => {
    if (!torEnabled) {
      Alert.alert('Tor Not Enabled', 'Please enable Tor first.');
      return;
    }

    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    try {
      await torService.newCircuit();
      Alert.alert('Success', 'New Tor circuit established');
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-4 py-3 border-b border-border bg-surface">
        <Text className="text-lg font-bold text-foreground">Web Tools</Text>
        <Text className="text-xs text-muted mt-1">Scraping & anonymity features</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Current IP */}
        <View className="mx-4 mt-4 p-4 bg-surface border border-border rounded-xl">
          <Text className="text-sm font-semibold text-foreground mb-2">Current IP Address</Text>
          <Text className="text-2xl font-bold text-primary mb-3">{currentIP}</Text>
          <TouchableOpacity
            onPress={testConnection}
            className="bg-primary/10 px-4 py-2 rounded-lg active:opacity-80"
          >
            <Text className="text-primary font-semibold text-center text-sm">Refresh IP</Text>
          </TouchableOpacity>
        </View>

        {/* Proxy Rotation */}
        <View className="mx-4 mt-4 p-4 bg-surface border border-border rounded-xl">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">Proxy Rotation</Text>
              <Text className="text-xs text-muted mt-1">
                Rotate through proxy servers for anonymity
              </Text>
            </View>
            <Switch
              value={proxyEnabled}
              onValueChange={handleProxyToggle}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={proxyEnabled ? colors.background : colors.muted}
            />
          </View>

          {proxyEnabled && (
            <View className="mt-2 pt-3 border-t border-border">
              <Text className="text-xs text-muted mb-2">Active Proxies</Text>
              {proxyList.filter(p => p.active).length > 0 ? (
                proxyList
                  .filter(p => p.active)
                  .map((proxy, index) => (
                    <View key={index} className="bg-background p-2 rounded-lg mb-2">
                      <Text className="text-xs text-foreground font-mono">
                        {proxy.host}:{proxy.port}
                      </Text>
                    </View>
                  ))
              ) : (
                <Text className="text-xs text-muted">No active proxies</Text>
              )}
            </View>
          )}
        </View>

        {/* Tor Network */}
        <View className="mx-4 mt-4 p-4 bg-surface border border-border rounded-xl">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-1">
              <Text className="text-base font-semibold text-foreground">Tor Network</Text>
              <Text className="text-xs text-muted mt-1">
                Access .onion sites and browse anonymously
              </Text>
            </View>
            <Switch
              value={torEnabled}
              onValueChange={handleTorToggle}
              trackColor={{ false: colors.border, true: colors.success }}
              thumbColor={torEnabled ? colors.background : colors.muted}
            />
          </View>

          {torEnabled && (
            <View className="mt-2 pt-3 border-t border-border gap-2">
              <View className="flex-row items-center gap-2">
                <View className={`w-2 h-2 rounded-full ${torConnected ? 'bg-success' : 'bg-error'}`} />
                <Text className="text-xs text-muted">
                  {torConnected ? 'Connected to Tor network' : 'Disconnected'}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={newTorCircuit}
                className="bg-primary/10 px-4 py-2 rounded-lg active:opacity-80 mt-2"
              >
                <Text className="text-primary font-semibold text-center text-sm">New Circuit</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Info */}
        <View className="mx-4 my-4 p-4 bg-warning/10 border border-warning rounded-xl">
          <Text className="text-sm font-semibold text-warning mb-2">🔒 Privacy Notice</Text>
          <Text className="text-xs text-foreground/80 leading-relaxed">
            These tools enhance your privacy but don't guarantee complete anonymity. Use responsibly and follow local laws.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
