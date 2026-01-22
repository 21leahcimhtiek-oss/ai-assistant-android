import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { exerciseService, type Exercise } from '@/lib/exercises';

export default function ExercisesScreen() {
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [exerciseStep, setExerciseStep] = useState(0);

  const exercises = exerciseService.getAllExercises();

  const startExercise = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setExerciseStep(0);
  };

  const nextStep = () => {
    if (selectedExercise && exerciseStep < selectedExercise.steps.length - 1) {
      setExerciseStep(exerciseStep + 1);
    }
  };

  const prevStep = () => {
    if (exerciseStep > 0) {
      setExerciseStep(exerciseStep - 1);
    }
  };

  const completeExercise = async () => {
    if (selectedExercise) {
      await exerciseService.logCompletion({
        exerciseId: selectedExercise.id,
        timestamp: Date.now(),
        helpfulness: 5,
      });
      setSelectedExercise(null);
      setExerciseStep(0);
      alert('Exercise completed! Great job! 🎉');
    }
  };

  const getExerciseIcon = (category: string) => {
    const icons: Record<string, string> = {
      breathing: '🫁',
      grounding: '🌍',
      cognitive: '🧠',
      relaxation: '😌',
      mindfulness: '🧘',
      gratitude: '🙏',
    };
    return icons[category] || '✨';
  };

  if (selectedExercise) {
    const currentStep = selectedExercise.steps[exerciseStep];
    const isLastStep = exerciseStep === selectedExercise.steps.length - 1;

    return (
      <ScreenContainer className="p-4">
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="mb-6">
            <TouchableOpacity
              onPress={() => {
                setSelectedExercise(null);
                setExerciseStep(0);
              }}
              activeOpacity={0.7}
              className="mb-4"
            >
              <Text className="text-primary text-base">← Back to Exercises</Text>
            </TouchableOpacity>
            
            <Text className="text-3xl font-bold text-foreground mb-2">
              {selectedExercise.title}
            </Text>
            <Text className="text-base text-muted">
              Step {exerciseStep + 1} of {selectedExercise.steps.length}
            </Text>
          </View>

          {/* Progress Bar */}
          <View className="bg-surface rounded-full h-2 mb-6">
            <View
              className="bg-primary rounded-full h-2"
              style={{ width: `${((exerciseStep + 1) / selectedExercise.steps.length) * 100}%` }}
            />
          </View>

          {/* Step Content */}
          <View className="bg-surface rounded-2xl p-6 mb-6 border border-border">
            <Text className="text-base text-foreground leading-relaxed">
              {currentStep}
            </Text>
          </View>

          {/* Navigation Buttons */}
          <View className="flex-row gap-3 mb-6">
            {exerciseStep > 0 && (
              <TouchableOpacity
                className="flex-1 bg-surface border border-border py-4 rounded-xl items-center"
                onPress={prevStep}
                activeOpacity={0.8}
              >
                <Text className="text-foreground font-semibold">← Previous</Text>
              </TouchableOpacity>
            )}

            {!isLastStep ? (
              <TouchableOpacity
                className="flex-1 bg-primary py-4 rounded-xl items-center"
                onPress={nextStep}
                activeOpacity={0.8}
              >
                <Text className="text-background font-semibold">Next →</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="flex-1 bg-success py-4 rounded-xl items-center"
                onPress={completeExercise}
                activeOpacity={0.8}
              >
                <Text className="text-background font-semibold">Complete ✓</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer className="p-4">
      <ScrollView showsVerticalScrollIndicator={false}>
        <View className="mb-6">
          <Text className="text-3xl font-bold text-foreground mb-2">Exercises</Text>
          <Text className="text-base text-muted">
            Evidence-based tools to support your mental health
          </Text>
        </View>

        {/* Exercise Categories */}
        {Object.entries(
          exercises.reduce((acc, exercise) => {
            if (!acc[exercise.category]) {
              acc[exercise.category] = [];
            }
            acc[exercise.category].push(exercise);
            return acc;
          }, {} as Record<string, Exercise[]>)
        ).map(([category, categoryExercises]) => (
          <View key={category} className="mb-6">
            <View className="flex-row items-center mb-3">
              <Text className="text-2xl mr-2">{getExerciseIcon(category)}</Text>
              <Text className="text-xl font-bold text-foreground capitalize">
                {category}
              </Text>
            </View>

            {categoryExercises.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                className="bg-surface rounded-2xl p-5 mb-3 border border-border"
                onPress={() => startExercise(exercise)}
                activeOpacity={0.7}
              >
                <View className="flex-row items-start justify-between mb-2">
                  <Text className="text-lg font-semibold text-foreground flex-1">
                    {exercise.title}
                  </Text>
                  <View className="bg-primary/10 px-3 py-1 rounded-full">
                    <Text className="text-xs text-primary font-semibold">
                      {exercise.duration} min
                    </Text>
                  </View>
                </View>

                <Text className="text-sm text-muted leading-relaxed mb-3">
                  {exercise.description}
                </Text>

                <View className="flex-row items-center">
                  <Text className="text-xs text-muted">
                    {exercise.steps.length} steps
                  </Text>

                </View>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>
    </ScreenContainer>
  );
}
