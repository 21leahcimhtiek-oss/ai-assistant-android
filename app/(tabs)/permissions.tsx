import { useState, useEffect } from 'react';
import { ScrollView, Text, View, Switch, Alert, Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { useColors } from '@/hooks/use-colors';
import { permissionService, Permission } from '@/lib/permissions';

export default function PermissionsScreen() {
  const colors = useColors();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    const perms = await permissionService.getAllPermissions();
    setPermissions(perms);
    setLoading(false);
  };

  const handleToggle = async (permission: Permission) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (!permission.granted) {
      // User wants to grant permission
      Alert.alert(
        'Grant Permission',
        `Allow AI Assistant to access your ${permission.name.toLowerCase()}?\n\n${permission.description}`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Allow',
            onPress: async () => {
              // First request system permission if needed
              if (!permission.systemGranted) {
                const granted = await permissionService.requestSystemPermission(permission.type);
                if (!granted) {
                  Alert.alert(
                    'System Permission Required',
                    'Please grant system permission in your device settings to enable this feature.'
                  );
                  return;
                }
              }
              
              // Then set user permission
              await permissionService.setPermission(permission.type, true);
              await loadPermissions();
              
              if (Platform.OS !== 'web') {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }
            },
          },
        ]
      );
    } else {
      // User wants to revoke permission
      await permissionService.setPermission(permission.type, false);
      await loadPermissions();
      
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    }
  };

  return (
    <ScreenContainer className="flex-1">
      {/* Header */}
      <View className="px-4 py-3 border-b border-border bg-surface">
        <Text className="text-lg font-bold text-foreground">Permissions</Text>
        <Text className="text-xs text-muted mt-1">Control what AI can access</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Warning Banner */}
        <View className="mx-4 mt-4 p-4 bg-warning/10 border border-warning rounded-xl">
          <Text className="text-sm text-warning font-semibold mb-1">⚠️ Security Notice</Text>
          <Text className="text-xs text-foreground/80 leading-relaxed">
            Only grant permissions you're comfortable with. The AI will have access to the data from these features when enabled.
          </Text>
        </View>

        {/* Permissions List */}
        <View className="px-4 py-4 gap-3">
          {loading ? (
            <Text className="text-muted text-center py-8">Loading permissions...</Text>
          ) : (
            permissions.map((permission, index) => (
              <View
                key={permission.type}
                className="bg-surface border border-border rounded-xl p-4"
              >
                <View className="flex-row items-start justify-between">
                  <View className="flex-1 pr-4">
                    <View className="flex-row items-center gap-2 mb-1">
                      <Text className="text-base font-semibold text-foreground">
                        {permission.name}
                      </Text>
                      {!permission.systemGranted && permission.granted && (
                        <View className="bg-error/20 px-2 py-0.5 rounded">
                          <Text className="text-xs text-error">System Denied</Text>
                        </View>
                      )}
                    </View>
                    <Text className="text-sm text-muted leading-relaxed">
                      {permission.description}
                    </Text>
                  </View>
                  <Switch
                    value={permission.granted}
                    onValueChange={() => handleToggle(permission)}
                    trackColor={{ false: colors.border, true: colors.success }}
                    thumbColor={permission.granted ? colors.background : colors.muted}
                  />
                </View>
              </View>
            ))
          )}
        </View>

        {/* Usage Info */}
        <View className="mx-4 mb-4 p-4 bg-surface border border-border rounded-xl">
          <Text className="text-sm font-semibold text-foreground mb-2">How it works</Text>
          <Text className="text-xs text-muted leading-relaxed">
            When you ask the AI to perform an action that requires a permission, it will check if you've granted access. If not, it will inform you that the permission is needed.
          </Text>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}
