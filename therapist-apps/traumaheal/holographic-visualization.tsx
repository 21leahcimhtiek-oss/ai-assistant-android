import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  ScrollView,
  Pressable,
  StyleSheet,
} from 'react-native';
import {
  HolographicARService,
  HolographicObject,
  ARScene,
  SpatialComputingService,
  SpatialEnvironment,
} from './holographic-ar';

const { width, height } = Dimensions.get('window');

interface HolographicVisualizationProps {
  sceneType?: 'trauma-timeline' | 'emdr' | 'grounding' | 'safe-space';
  onObjectTapped?: (object: HolographicObject) => void;
  interactive?: boolean;
}

export const HolographicVisualization: React.FC<HolographicVisualizationProps> = ({
  sceneType = 'safe-space',
  onObjectTapped,
  interactive = true,
}) => {
  const [scene, setScene] = useState<ARScene | null>(null);
  const [environment, setEnvironment] = useState<SpatialEnvironment | null>(null);
  const [selectedObject, setSelectedObject] = useState<HolographicObject | null>(null);
  const [animationValues] = useState(() =>
    Array.from({ length: 10 }, () => new Animated.Value(0))
  );

  useEffect(() => {
    loadScene();
  }, [sceneType]);

  const loadScene = async () => {
    switch (sceneType) {
      case 'safe-space':
        const safeEnv = SpatialComputingService.createSafeSpace();
        setEnvironment(safeEnv);
        break;
      case 'grounding':
        const groundingEnv = SpatialComputingService.createGroundingEnv();
        setEnvironment(groundingEnv);
        break;
      case 'emdr':
        const butterfly = HolographicARService.createEMDRButterfly();
        const emdrScene: ARScene = {
          id: 'emdr-' + Date.now(),
          name: 'EMDR Bilateral Stimulation',
          objects: [butterfly],
          backgroundColor: '#000033',
          ambientLight: 0.7,
          createdAt: Date.now(),
        };
        setScene(emdrScene);
        break;
      case 'trauma-timeline':
        // Sample trauma events for visualization
        const events = [
          { id: '1', severity: 8, name: 'Event 1' },
          { id: '2', severity: 6, name: 'Event 2' },
          { id: '3', severity: 4, name: 'Event 3' },
        ];
        const timelineObjects = HolographicARService.createTraumaTimeline(events);
        const timelineScene: ARScene = {
          id: 'timeline-' + Date.now(),
          name: 'Trauma Timeline',
          objects: timelineObjects,
          backgroundColor: '#000033',
          ambientLight: 0.7,
          createdAt: Date.now(),
        };
        setScene(timelineScene);
        break;
    }
  };

  const animateObject = (index: number) => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(animationValues[index], {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(animationValues[index], {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
  };

  const handleObjectTap = (object: HolographicObject) => {
    setSelectedObject(object);
    onObjectTapped?.(object);
  };

  const getObjectStyle = (object: HolographicObject, index: number) => {
    const scale = animationValues[index].interpolate({
      inputRange: [0, 1],
      outputRange: [0.8, 1.2],
    });

    const opacity = animationValues[index].interpolate({
      inputRange: [0, 0.5, 1],
      outputRange: [0.6, 1, 0.6],
    });

    return {
      transform: [{ scale }],
      opacity,
    };
  };

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="p-6 gap-6">
        {/* Holographic Scene Viewer */}
        <View className="bg-surface rounded-2xl p-6 border border-border overflow-hidden">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Holographic AR Visualization
          </Text>

          {/* 3D Scene Container */}
          <View
            style={{
              width: '100%',
              height: 300,
              backgroundColor: '#0a0e27',
              borderRadius: 12,
              borderWidth: 2,
              borderColor: '#00D4FF',
              justifyContent: 'center',
              alignItems: 'center',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Background Grid Effect */}
            <View
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                opacity: 0.1,
              }}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <View
                  key={`h-${i}`}
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: 1,
                    backgroundColor: '#00D4FF',
                    top: `${(i + 1) * 20}%`,
                  }}
                />
              ))}
              {Array.from({ length: 5 }).map((_, i) => (
                <View
                  key={`v-${i}`}
                  style={{
                    position: 'absolute',
                    width: 1,
                    height: '100%',
                    backgroundColor: '#00D4FF',
                    left: `${(i + 1) * 20}%`,
                  }}
                />
              ))}
            </View>

            {/* Holographic Objects */}
            <View
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {(scene?.objects || environment?.objects || []).map((object, index) => {
                animateObject(index);
                return (
                  <Animated.View
                    key={object.id}
                    style={[
                      {
                        position: 'absolute',
                        width: 60,
                        height: 60,
                        borderRadius: 30,
                        backgroundColor: object.color,
                        opacity: object.opacity,
                        left: `${50 + object.position.x * 50}%`,
                        top: `${50 + object.position.y * 50}%`,
                      },
                      getObjectStyle(object, index),
                    ]}
                  >
                    <Pressable
                      onPress={() => handleObjectTap(object)}
                      style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
                    >
                      <Text className="text-xs text-foreground font-bold">
                        {object.type === 'trauma-timeline' ? '⚡' : '✨'}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })}

              {/* Center Focal Point */}
              <View
                style={{
                  position: 'absolute',
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#FFD700',
                  opacity: 0.5,
                }}
              />
            </View>

            {/* Ambient Light Glow */}
            <View
              style={{
                position: 'absolute',
                width: '150%',
                height: '150%',
                borderRadius: 999,
                backgroundColor: '#00D4FF',
                opacity: 0.05,
              }}
            />
          </View>

          <Text className="text-xs text-muted mt-3">
            {sceneType === 'emdr' && 'Follow the bilateral movement for EMDR processing'}
            {sceneType === 'trauma-timeline' && 'Tap events to process trauma memories'}
            {sceneType === 'grounding' && 'Interact with the grounding sphere for 5-4-3-2-1 technique'}
            {sceneType === 'safe-space' && 'Your personal safe space for healing'}
          </Text>
        </View>

        {/* Selected Object Details */}
        {selectedObject && (
          <View className="bg-surface rounded-2xl p-6 border border-primary">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Object Details
            </Text>

            <View className="gap-3">
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Type</Text>
                <Text className="text-sm text-foreground font-semibold">
                  {selectedObject.type}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Interactable</Text>
                <Text className="text-sm text-foreground font-semibold">
                  {selectedObject.interactable ? '✓' : '✗'}
                </Text>
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted">Animated</Text>
                <Text className="text-sm text-foreground font-semibold">
                  {selectedObject.animated ? '✓' : '✗'}
                </Text>
              </View>

              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: selectedObject.color,
                  opacity: selectedObject.opacity,
                  marginTop: 8,
                }}
              />
            </View>
          </View>
        )}

        {/* Scene Information */}
        <View className="bg-surface rounded-2xl p-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Scene Information
          </Text>

          <View className="gap-2">
            <View className="flex-row justify-between items-center py-2 px-3 bg-background rounded-lg">
              <Text className="text-sm text-muted">Scene Type</Text>
              <Text className="text-sm text-foreground font-semibold capitalize">
                {sceneType}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-2 px-3 bg-background rounded-lg">
              <Text className="text-sm text-muted">Objects</Text>
              <Text className="text-sm text-foreground font-semibold">
                {(scene?.objects || environment?.objects || []).length}
              </Text>
            </View>

            <View className="flex-row justify-between items-center py-2 px-3 bg-background rounded-lg">
              <Text className="text-sm text-muted">Ambient Light</Text>
              <Text className="text-sm text-foreground font-semibold">
                {Math.round((scene?.ambientLight || environment?.lighting.intensity || 0.7) * 100)}%
              </Text>
            </View>
          </View>
        </View>

        {/* Holographic Effects Toggle */}
        <View className="bg-surface rounded-2xl p-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Holographic Effects
          </Text>

          <View className="gap-3">
            <Pressable className="bg-primary rounded-xl p-4 active:opacity-80">
              <Text className="text-center text-background font-semibold">
                Enable Glow Effect
              </Text>
            </Pressable>

            <Pressable className="bg-primary rounded-xl p-4 active:opacity-80">
              <Text className="text-center text-background font-semibold">
                Adjust Brightness
              </Text>
            </Pressable>

            <Pressable className="bg-primary rounded-xl p-4 active:opacity-80">
              <Text className="text-center text-background font-semibold">
                Toggle Grid
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default HolographicVisualization;
