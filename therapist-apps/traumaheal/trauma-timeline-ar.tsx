import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  ScrollView,
  Pressable,
  Dimensions,
  PanResponder,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { ScreenContainer } from '@/components/screen-container';
import { HolographicARService, GestureRecognitionService } from './holographic-ar';

const { width, height } = Dimensions.get('window');

interface TraumaEvent {
  id: string;
  name: string;
  description: string;
  severity: number; // 1-10
  date?: string;
  processed: boolean;
}

interface TraumaTimelineARProps {
  events?: TraumaEvent[];
  onEventSelected?: (event: TraumaEvent) => void;
  onEventProcessed?: (eventId: string) => void;
}

export const TraumaTimelineAR: React.FC<TraumaTimelineARProps> = ({
  events = [
    {
      id: '1',
      name: 'Initial Incident',
      description: 'First traumatic experience',
      severity: 9,
      date: '2020-01-15',
      processed: false,
    },
    {
      id: '2',
      name: 'Secondary Event',
      description: 'Related traumatic incident',
      severity: 7,
      date: '2020-06-20',
      processed: false,
    },
    {
      id: '3',
      name: 'Trigger Incident',
      description: 'Recent triggering event',
      severity: 5,
      date: '2024-01-10',
      processed: false,
    },
  ],
  onEventSelected,
  onEventProcessed,
}) => {
  const [selectedEvent, setSelectedEvent] = useState<TraumaEvent | null>(null);
  const [processedEvents, setProcessedEvents] = useState<Set<string>>(new Set());
  const [zoomLevel, setZoomLevel] = useState(1);
  const [timelineScroll, setTimelineScroll] = useState(0);

  const zoomAnim = useRef(new Animated.Value(1)).current;
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const selectedScale = useRef(new Animated.Value(1)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (evt, gestureState) => {
        const { dx, dy } = gestureState;
        scrollAnim.setValue(dx);
      },
      onPanResponderRelease: () => {
        Animated.spring(scrollAnim, {
          toValue: 0,
          useNativeDriver: false,
        }).start();
      },
    })
  ).current;

  const handleEventTap = (event: TraumaEvent) => {
    setSelectedEvent(event);
    onEventSelected?.(event);

    Animated.spring(selectedScale, {
      toValue: 1.1,
      useNativeDriver: false,
    }).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleProcessEvent = async (eventId: string) => {
    setProcessedEvents(new Set([...processedEvents, eventId]));
    onEventProcessed?.(eventId);

    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleZoom = (direction: 'in' | 'out') => {
    const newZoom = direction === 'in' ? Math.min(zoomLevel + 0.5, 3) : Math.max(zoomLevel - 0.5, 0.5);
    setZoomLevel(newZoom);

    Animated.spring(zoomAnim, {
      toValue: newZoom,
      useNativeDriver: false,
    }).start();

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const getSeverityColor = (severity: number) => {
    if (severity <= 3) return '#00FF00';
    if (severity <= 6) return '#FFFF00';
    if (severity <= 8) return '#FF8800';
    return '#FF0000';
  };

  const getSeverityLabel = (severity: number) => {
    if (severity <= 3) return 'Mild';
    if (severity <= 6) return 'Moderate';
    if (severity <= 8) return 'Severe';
    return 'Critical';
  };

  return (
    <ScreenContainer className="p-0">
      <ScrollView className="flex-1" contentContainerStyle={{ flexGrow: 1 }}>
        <View className="p-6 gap-6">
          {/* Timeline Header */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-2xl font-bold text-foreground mb-2">
              Trauma Timeline AR
            </Text>
            <Text className="text-sm text-muted">
              Interactive visualization of traumatic events
            </Text>
          </View>

          {/* AR Timeline Visualization */}
          <View className="bg-surface rounded-2xl p-6 border border-border overflow-hidden">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-foreground">
                Timeline Events
              </Text>
              <View className="flex-row gap-2">
                <Pressable
                  onPress={() => handleZoom('in')}
                  className="bg-primary rounded-lg p-2 active:opacity-80"
                >
                  <Text className="text-background font-bold">+</Text>
                </Pressable>
                <Pressable
                  onPress={() => handleZoom('out')}
                  className="bg-primary rounded-lg p-2 active:opacity-80"
                >
                  <Text className="text-background font-bold">−</Text>
                </Pressable>
              </View>
            </View>

            {/* Timeline Container */}
            <Animated.View
              {...panResponder.panHandlers}
              style={{
                width: '100%',
                height: 280,
                backgroundColor: '#0a0e27',
                borderRadius: 12,
                borderWidth: 2,
                borderColor: '#00D4FF',
                position: 'relative',
                overflow: 'hidden',
                transform: [
                  { scale: zoomAnim },
                  { translateX: scrollAnim },
                ],
              }}
            >
              {/* Timeline Background Grid */}
              <View
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  opacity: 0.1,
                }}
              >
                {Array.from({ length: 4 }).map((_, i) => (
                  <View
                    key={`line-${i}`}
                    style={{
                      position: 'absolute',
                      width: '100%',
                      height: 1,
                      backgroundColor: '#00D4FF',
                      top: `${(i + 1) * 25}%`,
                    }}
                  />
                ))}
              </View>

              {/* Center Timeline Axis */}
              <View
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: 2,
                  backgroundColor: '#FFD700',
                  top: '50%',
                  opacity: 0.5,
                }}
              />

              {/* Event Nodes */}
              {events.map((event, index) => {
                const isProcessed = processedEvents.has(event.id);
                const isSelected = selectedEvent?.id === event.id;
                const xPosition = ((index + 1) / (events.length + 1)) * 100;
                const yOffset = index % 2 === 0 ? -60 : 60;

                return (
                  <View
                    key={event.id}
                    style={{
                      position: 'absolute',
                      left: `${xPosition}%`,
                      top: '50%',
                      transform: [{ translateY: yOffset }],
                    }}
                  >
                    {/* Connection Line */}
                    <View
                      style={{
                        position: 'absolute',
                        width: 2,
                        height: Math.abs(yOffset),
                        backgroundColor: getSeverityColor(event.severity),
                        opacity: 0.5,
                        left: '50%',
                        top: index % 2 === 0 ? '100%' : 'auto',
                        bottom: index % 2 === 1 ? '100%' : 'auto',
                      }}
                    />

                    {/* Event Node */}
                    <Animated.View
                      style={{
                        width: 70,
                        height: 70,
                        borderRadius: 35,
                        backgroundColor: getSeverityColor(event.severity),
                        opacity: isProcessed ? 0.5 : 0.9,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderWidth: isSelected ? 3 : 1,
                        borderColor: isSelected ? '#FFD700' : getSeverityColor(event.severity),
                        transform: isSelected ? [{ scale: selectedScale }] : [],
                      }}
                    >
                      <Pressable
                        onPress={() => handleEventTap(event)}
                        style={{
                          width: '100%',
                          height: '100%',
                          justifyContent: 'center',
                          alignItems: 'center',
                        }}
                      >
                        <Text style={{ fontSize: 24 }}>
                          {isProcessed ? '✓' : '⚡'}
                        </Text>
                      </Pressable>
                    </Animated.View>

                    {/* Event Label */}
                    <Text
                      style={{
                        position: 'absolute',
                        top: index % 2 === 0 ? -30 : 'auto',
                        bottom: index % 2 === 1 ? -30 : 'auto',
                        left: -20,
                        right: -20,
                        textAlign: 'center',
                        fontSize: 10,
                        color: '#ECEDEE',
                        fontWeight: '600',
                      }}
                    >
                      {event.name}
                    </Text>
                  </View>
                );
              })}
            </Animated.View>

            <Text className="text-xs text-muted mt-3">
              Tap events to select, pinch to zoom, drag to pan
            </Text>
          </View>

          {/* Selected Event Details */}
          {selectedEvent && (
            <View className="bg-surface rounded-2xl p-6 border border-primary">
              <Text className="text-lg font-semibold text-foreground mb-4">
                Event Details
              </Text>

              <View className="gap-3 mb-4">
                <View>
                  <Text className="text-xs text-muted mb-1">Event Name</Text>
                  <Text className="text-base font-semibold text-foreground">
                    {selectedEvent.name}
                  </Text>
                </View>

                <View>
                  <Text className="text-xs text-muted mb-1">Description</Text>
                  <Text className="text-sm text-foreground">
                    {selectedEvent.description}
                  </Text>
                </View>

                <View>
                  <Text className="text-xs text-muted mb-1">Date</Text>
                  <Text className="text-sm text-foreground">
                    {selectedEvent.date || 'Not specified'}
                  </Text>
                </View>

                <View>
                  <Text className="text-xs text-muted mb-2">Severity</Text>
                  <View className="flex-row items-center gap-2">
                    <View
                      style={{
                        width: 40,
                        height: 20,
                        borderRadius: 10,
                        backgroundColor: getSeverityColor(selectedEvent.severity),
                      }}
                    />
                    <Text className="text-sm font-semibold text-foreground">
                      {selectedEvent.severity}/10 - {getSeverityLabel(selectedEvent.severity)}
                    </Text>
                  </View>
                </View>
              </View>

              {!processedEvents.has(selectedEvent.id) && (
                <Pressable
                  onPress={() => handleProcessEvent(selectedEvent.id)}
                  className="bg-primary rounded-xl p-4 active:opacity-80"
                >
                  <Text className="text-center text-background font-semibold">
                    Process This Event
                  </Text>
                </Pressable>
              )}

              {processedEvents.has(selectedEvent.id) && (
                <View className="bg-success/20 rounded-xl p-4 border border-success">
                  <Text className="text-center text-success font-semibold">
                    ✓ Event Processed
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Timeline Statistics */}
          <View className="bg-surface rounded-2xl p-6 border border-border">
            <Text className="text-lg font-semibold text-foreground mb-4">
              Timeline Statistics
            </Text>

            <View className="gap-2">
              <View className="flex-row justify-between items-center py-2 px-3 bg-background rounded-lg">
                <Text className="text-sm text-muted">Total Events</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {events.length}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2 px-3 bg-background rounded-lg">
                <Text className="text-sm text-muted">Processed</Text>
                <Text className="text-sm font-semibold text-success">
                  {processedEvents.size}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2 px-3 bg-background rounded-lg">
                <Text className="text-sm text-muted">Remaining</Text>
                <Text className="text-sm font-semibold text-warning">
                  {events.length - processedEvents.size}
                </Text>
              </View>

              <View className="flex-row justify-between items-center py-2 px-3 bg-background rounded-lg">
                <Text className="text-sm text-muted">Average Severity</Text>
                <Text className="text-sm font-semibold text-foreground">
                  {(events.reduce((sum, e) => sum + e.severity, 0) / events.length).toFixed(1)}/10
                </Text>
              </View>

              {/* Progress Bar */}
              <View className="mt-3 p-3 bg-background rounded-lg">
                <View className="flex-row justify-between items-center mb-2">
                  <Text className="text-xs text-muted">Processing Progress</Text>
                  <Text className="text-xs font-semibold text-foreground">
                    {Math.round((processedEvents.size / events.length) * 100)}%
                  </Text>
                </View>
                <View className="w-full h-2 bg-border rounded-full overflow-hidden">
                  <View
                    style={{
                      width: `${(processedEvents.size / events.length) * 100}%`,
                      height: '100%',
                      backgroundColor: '#00FF00',
                    }}
                  />
                </View>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
};

export default TraumaTimelineAR;
