import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, TextInput } from 'react-native';
import { ScreenContainer } from '@/components/screen-container';

export default function OnboardingScreen() {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [traumaType, setTraumaType] = useState('');
  const [goals, setGoals] = useState('');

  const steps = [
    {
      title: 'Welcome to TraumaHeal',
      subtitle: 'Your holographic trauma-informed therapy companion',
      content: (
        <View className="gap-4">
          <View className="bg-primary/10 rounded-2xl p-6 border border-primary/30">
            <Text className="text-4xl mb-3">🌊</Text>
            <Text className="text-lg font-semibold text-foreground mb-2">
              Trauma-Informed Care
            </Text>
            <Text className="text-sm text-muted">
              Evidence-based techniques including EMDR, grounding exercises, and AI support
            </Text>
          </View>

          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-3">
              This app is designed to:
            </Text>
            <View className="gap-2">
              <Text className="text-sm text-muted">✓ Support trauma processing safely</Text>
              <Text className="text-sm text-muted">✓ Provide grounding techniques</Text>
              <Text className="text-sm text-muted">✓ Track your recovery progress</Text>
              <Text className="text-sm text-muted">✓ Connect you with professional therapists</Text>
            </View>
          </View>

          <View className="bg-error/10 rounded-2xl p-4 border border-error/30">
            <Text className="text-xs font-semibold text-error mb-2">⚠️ Important</Text>
            <Text className="text-xs text-error">
              TraumaHeal is not a replacement for professional mental health treatment. Always consult with a qualified therapist.
            </Text>
          </View>
        </View>
      ),
    },
    {
      title: 'Tell Us About You',
      subtitle: 'Help us personalize your experience',
      content: (
        <View className="gap-4">
          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">Your Name</Text>
            <TextInput
              placeholder="Enter your name"
              placeholderTextColor="#687076"
              value={name}
              onChangeText={setName}
              className="bg-surface border border-border rounded-lg p-3 text-foreground"
            />
          </View>

          <View>
            <Text className="text-sm font-semibold text-foreground mb-2">
              What type of trauma have you experienced?
            </Text>
            <View className="gap-2">
              {['PTSD', 'Complex Trauma', 'Childhood Trauma', 'Accident/Injury', 'Other'].map(
                type => (
                  <Pressable
                    key={type}
                    onPress={() => setTraumaType(type)}
                    className={`border rounded-lg p-3 ${
                      traumaType === type
                        ? 'bg-primary border-primary'
                        : 'bg-surface border-border'
                    }`}
                  >
                    <Text
                      className={`font-semibold ${
                        traumaType === type ? 'text-background' : 'text-foreground'
                      }`}
                    >
                      {type}
                    </Text>
                  </Pressable>
                )
              )}
            </View>
          </View>
        </View>
      ),
    },
    {
      title: 'Your Recovery Goals',
      subtitle: 'What would you like to achieve?',
      content: (
        <View className="gap-4">
          <TextInput
            placeholder="Describe your recovery goals..."
            placeholderTextColor="#687076"
            value={goals}
            onChangeText={setGoals}
            multiline
            numberOfLines={5}
            className="bg-surface border border-border rounded-lg p-3 text-foreground"
            style={{ textAlignVertical: 'top' }}
          />

          <View className="bg-primary/10 rounded-2xl p-4 border border-primary/30">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Common Goals
            </Text>
            <View className="gap-1">
              <Text className="text-sm text-muted">• Reduce trauma intensity</Text>
              <Text className="text-sm text-muted">• Manage anxiety and flashbacks</Text>
              <Text className="text-sm text-muted">• Improve sleep quality</Text>
              <Text className="text-sm text-muted">• Build coping skills</Text>
              <Text className="text-sm text-muted">• Process traumatic memories</Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      title: 'Safety First',
      subtitle: 'Important information about using TraumaHeal',
      content: (
        <View className="gap-4">
          <View className="bg-error/10 rounded-2xl p-4 border border-error/30">
            <Text className="text-sm font-semibold text-error mb-2">Crisis Resources</Text>
            <Text className="text-xs text-error mb-3">
              If you're in crisis, please contact emergency services immediately:
            </Text>
            <View className="gap-2">
              <View className="bg-background rounded-lg p-2">
                <Text className="text-xs font-semibold text-foreground">
                  National Suicide Prevention Lifeline
                </Text>
                <Text className="text-xs text-muted mt-1">📞 988</Text>
              </View>
              <View className="bg-background rounded-lg p-2">
                <Text className="text-xs font-semibold text-foreground">
                  Crisis Text Line
                </Text>
                <Text className="text-xs text-muted mt-1">💬 Text HOME to 741741</Text>
              </View>
              <View className="bg-background rounded-lg p-2">
                <Text className="text-xs font-semibold text-foreground">
                  Emergency Services
                </Text>
                <Text className="text-xs text-muted mt-1">📞 911</Text>
              </View>
            </View>
          </View>

          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-2">
              Using TraumaHeal Safely
            </Text>
            <View className="gap-2">
              <Text className="text-xs text-muted">
                • Start with grounding exercises before trauma processing
              </Text>
              <Text className="text-xs text-muted">
                • Take breaks if you feel overwhelmed
              </Text>
              <Text className="text-xs text-muted">
                • Use in a safe, private environment
              </Text>
              <Text className="text-xs text-muted">
                • Work with a therapist for best results
              </Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      title: 'Ready to Begin',
      subtitle: 'You are now set up with TraumaHeal',
      content: (
        <View className="gap-4">
          <View className="bg-success/10 rounded-2xl p-6 border border-success/30 text-center">
            <Text className="text-5xl mb-3">✨</Text>
            <Text className="text-lg font-semibold text-foreground mb-2">
              Welcome, {name || 'Friend'}!
            </Text>
            <Text className="text-sm text-muted">
              Your personalized trauma recovery journey starts now.
            </Text>
          </View>

          <View className="bg-surface rounded-2xl p-4 border border-border">
            <Text className="text-sm font-semibold text-foreground mb-3">
              What's Next?
            </Text>
            <View className="gap-2">
              <View className="flex-row gap-2">
                <Text className="text-primary font-bold">1</Text>
                <Text className="text-sm text-muted flex-1">
                  Start with grounding exercises to build safety
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Text className="text-primary font-bold">2</Text>
                <Text className="text-sm text-muted flex-1">
                  Try EMDR simulation when ready
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Text className="text-primary font-bold">3</Text>
                <Text className="text-sm text-muted flex-1">
                  Connect with a professional therapist
                </Text>
              </View>
              <View className="flex-row gap-2">
                <Text className="text-primary font-bold">4</Text>
                <Text className="text-sm text-muted flex-1">
                  Track your recovery progress
                </Text>
              </View>
            </View>
          </View>
        </View>
      ),
    },
  ];

  const currentStep = steps[step];

  return (
    <ScreenContainer className="p-0 flex-col">
      {/* Progress Bar */}
      <View className="bg-background border-b border-border p-4">
        <View className="flex-row gap-1 mb-3">
          {steps.map((_, idx) => (
            <View
              key={idx}
              className={`flex-1 h-1 rounded-full ${
                idx <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </View>
        <Text className="text-xs text-muted">
          Step {step + 1} of {steps.length}
        </Text>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 p-6">
        <View className="gap-4">
          <View>
            <Text className="text-3xl font-bold text-foreground mb-2">
              {currentStep.title}
            </Text>
            <Text className="text-base text-muted">{currentStep.subtitle}</Text>
          </View>

          <View>{currentStep.content}</View>
        </View>
      </ScrollView>

      {/* Navigation */}
      <View className="border-t border-border p-4 bg-background gap-3">
        <View className="flex-row gap-3">
          {step > 0 && (
            <Pressable
              onPress={() => setStep(step - 1)}
              className="flex-1 bg-surface border border-border rounded-lg p-3 active:opacity-80"
            >
              <Text className="text-center text-foreground font-semibold">Back</Text>
            </Pressable>
          )}

          <Pressable
            onPress={() => setStep(step + 1)}
            disabled={step === steps.length - 1}
            className={`flex-1 rounded-lg p-3 active:opacity-80 ${
              step === steps.length - 1 ? 'bg-success' : 'bg-primary'
            }`}
          >
            <Text className="text-center text-background font-semibold">
              {step === steps.length - 1 ? 'Get Started' : 'Next'}
            </Text>
          </Pressable>
        </View>

        <Pressable className="p-3">
          <Text className="text-center text-muted text-sm">Skip Tutorial</Text>
        </Pressable>
      </View>
    </ScreenContainer>
  );
}
