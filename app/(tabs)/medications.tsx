import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  medicationTracker,
  type Medication,
  type MedicationLog,
} from '@/lib/medication-tracker';

export default function MedicationsScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<Array<{
    medication: Medication;
    time: string;
    taken: boolean;
  }>>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Add medication form state
  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 'daily' as Medication['frequency'],
    times: ['08:00'],
    purpose: '',
    prescribedBy: '',
    notes: '',
    remindersEnabled: true,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [meds, schedule] = await Promise.all([
        medicationTracker.getActiveMedications(),
        medicationTracker.getTodaySchedule(),
      ]);
      setMedications(meds);
      setTodaySchedule(schedule);
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  };

  const handleAddMedication = async () => {
    if (!newMed.name.trim() || !newMed.dosage.trim()) {
      Alert.alert('Error', 'Please fill in medication name and dosage');
      return;
    }

    setLoading(true);
    try {
      await medicationTracker.addMedication({
        ...newMed,
        startDate: Date.now(),
      });
      
      // Reset form
      setNewMed({
        name: '',
        dosage: '',
        frequency: 'daily',
        times: ['08:00'],
        purpose: '',
        prescribedBy: '',
        notes: '',
        remindersEnabled: true,
      });
      
      setShowAddModal(false);
      await loadData();
      Alert.alert('Success', 'Medication added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add medication');
    } finally {
      setLoading(false);
    }
  };

  const handleLogDose = async (medicationId: string, taken: boolean) => {
    try {
      await medicationTracker.logMedicationTaken(medicationId, taken);
      await loadData();
    } catch (error) {
      Alert.alert('Error', 'Failed to log medication');
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    Alert.alert(
      'Delete Medication',
      'Are you sure you want to delete this medication?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicationTracker.deleteMedication(medicationId);
              await loadData();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete medication');
            }
          },
        },
      ]
    );
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return 'text-success';
    if (rate >= 70) return 'text-warning';
    return 'text-error';
  };

  return (
    <ScreenContainer className="p-4">
      <ScrollView>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View>
            <Text className="text-3xl font-bold text-foreground mb-2">
              Medications
            </Text>
            <Text className="text-base text-muted">
              Track your medication schedule
            </Text>
          </View>
          <TouchableOpacity
            className="bg-primary w-12 h-12 rounded-full items-center justify-center"
            onPress={() => setShowAddModal(true)}
            activeOpacity={0.8}
          >
            <Text className="text-background text-2xl font-bold">+</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule */}
        {todaySchedule.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-foreground mb-3">
              📅 Today's Schedule
            </Text>
            {todaySchedule.map((item, index) => (
              <View
                key={`${item.medication.id}_${item.time}_${index}`}
                className="bg-surface rounded-2xl p-5 border border-border mb-3"
              >
                <View className="flex-row items-center justify-between mb-3">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground mb-1">
                      {item.medication.name}
                    </Text>
                    <Text className="text-sm text-muted">
                      {item.medication.dosage} at {item.time}
                    </Text>
                  </View>
                  {item.taken ? (
                    <View className="bg-success/20 px-4 py-2 rounded-xl">
                      <Text className="text-success font-semibold">✓ Taken</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      className="bg-primary px-4 py-2 rounded-xl"
                      onPress={() => handleLogDose(item.medication.id, true)}
                      activeOpacity={0.8}
                    >
                      <Text className="text-background font-semibold">
                        Mark Taken
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* All Medications */}
        {medications.length > 0 && (
          <View className="mb-6">
            <Text className="text-xl font-bold text-foreground mb-3">
              💊 All Medications
            </Text>
            {medications.map((med) => (
              <MedicationCard
                key={med.id}
                medication={med}
                onDelete={() => handleDeleteMedication(med.id)}
              />
            ))}
          </View>
        )}

        {medications.length === 0 && (
          <View className="items-center py-12">
            <Text className="text-6xl mb-4">💊</Text>
            <Text className="text-lg text-muted">No medications yet</Text>
            <Text className="text-sm text-muted mt-2">
              Tap + to add your first medication
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Add Medication Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-background rounded-t-3xl p-6" style={{ maxHeight: '90%' }}>
            <ScrollView>
              <Text className="text-2xl font-bold text-foreground mb-6">
                Add Medication
              </Text>

              <Text className="text-sm text-muted mb-2">Medication Name *</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl p-4 text-foreground mb-4"
                placeholder="e.g., Sertraline"
                placeholderTextColor="#9BA1A6"
                value={newMed.name}
                onChangeText={(text) => setNewMed({ ...newMed, name: text })}
              />

              <Text className="text-sm text-muted mb-2">Dosage *</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl p-4 text-foreground mb-4"
                placeholder="e.g., 50mg, 2 tablets"
                placeholderTextColor="#9BA1A6"
                value={newMed.dosage}
                onChangeText={(text) => setNewMed({ ...newMed, dosage: text })}
              />

              <Text className="text-sm text-muted mb-2">Purpose</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl p-4 text-foreground mb-4"
                placeholder="e.g., Depression, Anxiety"
                placeholderTextColor="#9BA1A6"
                value={newMed.purpose}
                onChangeText={(text) => setNewMed({ ...newMed, purpose: text })}
              />

              <Text className="text-sm text-muted mb-2">Prescribed By</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl p-4 text-foreground mb-4"
                placeholder="e.g., Dr. Smith"
                placeholderTextColor="#9BA1A6"
                value={newMed.prescribedBy}
                onChangeText={(text) => setNewMed({ ...newMed, prescribedBy: text })}
              />

              <Text className="text-sm text-muted mb-2">Time</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl p-4 text-foreground mb-4"
                placeholder="08:00"
                placeholderTextColor="#9BA1A6"
                value={newMed.times[0]}
                onChangeText={(text) => setNewMed({ ...newMed, times: [text] })}
              />

              <Text className="text-sm text-muted mb-2">Notes</Text>
              <TextInput
                className="bg-surface border border-border rounded-xl p-4 text-foreground mb-6"
                placeholder="Additional notes..."
                placeholderTextColor="#9BA1A6"
                value={newMed.notes}
                onChangeText={(text) => setNewMed({ ...newMed, notes: text })}
                multiline
                numberOfLines={3}
              />

              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-primary py-4 rounded-xl items-center"
                  onPress={handleAddMedication}
                  disabled={loading}
                  activeOpacity={0.8}
                  style={{ opacity: loading ? 0.5 : 1 }}
                >
                  <Text className="text-background font-semibold text-base">
                    {loading ? 'Adding...' : 'Add Medication'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-surface border border-border py-4 px-6 rounded-xl items-center"
                  onPress={() => setShowAddModal(false)}
                  activeOpacity={0.8}
                >
                  <Text className="text-muted font-semibold text-base">Cancel</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </ScreenContainer>
  );
}

function MedicationCard({
  medication,
  onDelete,
}: {
  medication: Medication;
  onDelete: () => void;
}) {
  const [adherenceRate, setAdherenceRate] = useState(0);
  const [effectiveness, setEffectiveness] = useState(0);

  useEffect(() => {
    loadStats();
  }, [medication.id]);

  const loadStats = async () => {
    try {
      const [rate, eff] = await Promise.all([
        medicationTracker.getAdherenceRate(medication.id, 7),
        medicationTracker.getAverageEffectiveness(medication.id, 7),
      ]);
      setAdherenceRate(Math.round(rate));
      setEffectiveness(Math.round(eff));
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const getAdherenceColor = (rate: number) => {
    if (rate >= 90) return '#22C55E';
    if (rate >= 70) return '#F59E0B';
    return '#EF4444';
  };

  return (
    <View className="bg-surface rounded-2xl p-5 border border-border mb-3">
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className="text-lg font-bold text-foreground mb-1">
            {medication.name}
          </Text>
          <Text className="text-sm text-muted mb-2">{medication.dosage}</Text>
          {medication.purpose && (
            <Text className="text-xs text-primary">
              Purpose: {medication.purpose}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onDelete} activeOpacity={0.7}>
          <Text className="text-error text-sm">Delete</Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row gap-3 mb-3">
        {medication.times.map((time, index) => (
          <View
            key={index}
            className="bg-primary/10 px-3 py-1 rounded-lg"
          >
            <Text className="text-primary text-xs font-semibold">
              🕐 {time}
            </Text>
          </View>
        ))}
      </View>

      {adherenceRate > 0 && (
        <View className="bg-background rounded-xl p-3">
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-sm text-muted">7-Day Adherence</Text>
            <Text
              className="text-sm font-bold"
              style={{ color: getAdherenceColor(adherenceRate) }}
            >
              {adherenceRate}%
            </Text>
          </View>
          <View className="bg-border rounded-full h-2 overflow-hidden">
            <View
              className="h-full rounded-full"
              style={{
                width: `${adherenceRate}%`,
                backgroundColor: getAdherenceColor(adherenceRate),
              }}
            />
          </View>
        </View>
      )}
    </View>
  );
}
