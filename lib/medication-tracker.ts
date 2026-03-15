import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

/**
 * Medication Tracker Service
 * Track medications, schedules, side effects, and effectiveness
 */

export interface Medication {
  id: string;
  name: string;
  dosage: string; // e.g., "10mg", "2 tablets"
  frequency: 'daily' | 'twice_daily' | 'three_times_daily' | 'weekly' | 'as_needed';
  times: string[]; // e.g., ["08:00", "20:00"]
  startDate: number;
  endDate?: number;
  prescribedBy?: string;
  purpose: string;
  notes?: string;
  remindersEnabled: boolean;
  notificationIds: string[]; // Store notification IDs for cancellation
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  timestamp: number;
  taken: boolean;
  skipped: boolean;
  skipReason?: string;
  sideEffects?: string[];
  effectiveness?: number; // 1-10 scale
  notes?: string;
}

export interface SideEffect {
  id: string;
  medicationId: string;
  effect: string;
  severity: 'mild' | 'moderate' | 'severe';
  timestamp: number;
  notes?: string;
}

const MEDICATIONS_KEY = '@mindspace_medications';
const MEDICATION_LOGS_KEY = '@mindspace_medication_logs';
const SIDE_EFFECTS_KEY = '@mindspace_side_effects';

class MedicationTrackerService {
  /**
   * Add a new medication
   */
  async addMedication(medication: Omit<Medication, 'id' | 'notificationIds'>): Promise<Medication> {
    try {
      const newMed: Medication = {
        ...medication,
        id: `med_${Date.now()}`,
        notificationIds: [],
      };

      const medications = await this.getAllMedications();
      medications.push(newMed);
      await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));

      // Schedule reminders if enabled
      if (newMed.remindersEnabled) {
        await this.scheduleReminders(newMed);
      }

      return newMed;
    } catch (error) {
      console.error('Error adding medication:', error);
      throw error;
    }
  }

  /**
   * Update a medication
   */
  async updateMedication(medicationId: string, updates: Partial<Medication>): Promise<void> {
    try {
      const medications = await this.getAllMedications();
      const index = medications.findIndex(m => m.id === medicationId);
      
      if (index === -1) {
        throw new Error('Medication not found');
      }

      const oldMed = medications[index];
      
      // Cancel old reminders
      if (oldMed.notificationIds.length > 0) {
        await this.cancelReminders(oldMed);
      }

      // Update medication
      medications[index] = { ...oldMed, ...updates };
      await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(medications));

      // Schedule new reminders if enabled
      if (medications[index].remindersEnabled) {
        await this.scheduleReminders(medications[index]);
      }
    } catch (error) {
      console.error('Error updating medication:', error);
      throw error;
    }
  }

  /**
   * Delete a medication
   */
  async deleteMedication(medicationId: string): Promise<void> {
    try {
      const medications = await this.getAllMedications();
      const medicationToDelete = medications.find(medicationItem => medicationItem.id === medicationId);
      
      if (medicationToDelete) {
        // Cancel reminders
        await this.cancelReminders(medicationToDelete);
      }

      const remainingMedications = medications.filter(medicationItem => medicationItem.id !== medicationId);
      await AsyncStorage.setItem(MEDICATIONS_KEY, JSON.stringify(remainingMedications));
    } catch (error) {
      console.error('Error deleting medication:', error);
      throw error;
    }
  }

  /**
   * Get all medications
   */
  async getAllMedications(): Promise<Medication[]> {
    try {
      const data = await AsyncStorage.getItem(MEDICATIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting medications:', error);
      return [];
    }
  }

  /**
   * Get active medications (not ended)
   */
  async getActiveMedications(): Promise<Medication[]> {
    try {
      const medications = await this.getAllMedications();
      const now = Date.now();
      return medications.filter(
        medicationItem => !medicationItem.endDate || medicationItem.endDate > now
      );
    } catch (error) {
      console.error('Error getting active medications:', error);
      return [];
    }
  }

  /**
   * Schedule medication reminders
   */
  async scheduleReminders(medication: Medication): Promise<void> {
    try {
      const notificationIds: string[] = [];

      for (const time of medication.times) {
        const [hours, minutes] = time.split(':').map(Number);
        
        const notificationId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '💊 Medication Reminder',
            body: `Time to take ${medication.name} (${medication.dosage})`,
            data: { medicationId: medication.id },
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: hours,
            minute: minutes,
            repeats: true,
          } as any,
        });

        notificationIds.push(notificationId);
      }

      // Update medication with notification IDs
      await this.updateMedication(medication.id, { notificationIds });
    } catch (error) {
      console.error('Error scheduling reminders:', error);
    }
  }

  /**
   * Cancel medication reminders
   */
  async cancelReminders(medication: Medication): Promise<void> {
    try {
      for (const notificationId of medication.notificationIds) {
        await Notifications.cancelScheduledNotificationAsync(notificationId);
      }
    } catch (error) {
      console.error('Error canceling reminders:', error);
    }
  }

  /**
   * Log medication taken
   */
  async logMedicationTaken(
    medicationId: string,
    taken: boolean,
    options?: {
      skipped?: boolean;
      skipReason?: string;
      sideEffects?: string[];
      effectiveness?: number;
      notes?: string;
    }
  ): Promise<MedicationLog> {
    try {
      const log: MedicationLog = {
        id: `log_${Date.now()}`,
        medicationId,
        timestamp: Date.now(),
        taken,
        skipped: options?.skipped || false,
        skipReason: options?.skipReason,
        sideEffects: options?.sideEffects,
        effectiveness: options?.effectiveness,
        notes: options?.notes,
      };

      const logs = await this.getAllLogs();
      logs.push(log);
      await AsyncStorage.setItem(MEDICATION_LOGS_KEY, JSON.stringify(logs));

      return log;
    } catch (error) {
      console.error('Error logging medication:', error);
      throw error;
    }
  }

  /**
   * Get all medication logs
   */
  async getAllLogs(): Promise<MedicationLog[]> {
    try {
      const data = await AsyncStorage.getItem(MEDICATION_LOGS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting logs:', error);
      return [];
    }
  }

  /**
   * Get logs for a specific medication
   */
  async getLogsForMedication(medicationId: string): Promise<MedicationLog[]> {
    try {
      const logs = await this.getAllLogs();
      return logs.filter(log => log.medicationId === medicationId);
    } catch (error) {
      console.error('Error getting medication logs:', error);
      return [];
    }
  }

  /**
   * Get today's medication schedule
   */
  async getTodaySchedule(): Promise<Array<{ medication: Medication; time: string; taken: boolean }>> {
    try {
      const medications = await this.getActiveMedications();
      const logs = await this.getAllLogs();
      const today = new Date().toDateString();
      
      const schedule: Array<{ medication: Medication; time: string; taken: boolean }> = [];

      for (const medication of medications) {
        for (const time of medication.times) {
          const todayLogs = logs.filter(log => 
            log.medicationId === medication.id &&
            new Date(log.timestamp).toDateString() === today
          );
          
          const taken = todayLogs.some(log => log.taken);
          
          schedule.push({
            medication,
            time,
            taken,
          });
        }
      }

      // Sort by time
      schedule.sort((a, b) => a.time.localeCompare(b.time));

      return schedule;
    } catch (error) {
      console.error('Error getting today schedule:', error);
      return [];
    }
  }

  /**
   * Report a side effect
   */
  async reportSideEffect(sideEffect: Omit<SideEffect, 'id'>): Promise<SideEffect> {
    try {
      const newEffect: SideEffect = {
        ...sideEffect,
        id: `effect_${Date.now()}`,
      };

      const effects = await this.getAllSideEffects();
      effects.push(newEffect);
      await AsyncStorage.setItem(SIDE_EFFECTS_KEY, JSON.stringify(effects));

      return newEffect;
    } catch (error) {
      console.error('Error reporting side effect:', error);
      throw error;
    }
  }

  /**
   * Get all side effects
   */
  async getAllSideEffects(): Promise<SideEffect[]> {
    try {
      const data = await AsyncStorage.getItem(SIDE_EFFECTS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting side effects:', error);
      return [];
    }
  }

  /**
   * Get side effects for a specific medication
   */
  async getSideEffectsForMedication(medicationId: string): Promise<SideEffect[]> {
    try {
      const effects = await this.getAllSideEffects();
      return effects.filter(effect => effect.medicationId === medicationId);
    } catch (error) {
      console.error('Error getting medication side effects:', error);
      return [];
    }
  }

  /**
   * Get adherence rate for a medication
   */
  async getAdherenceRate(medicationId: string, days: number = 7): Promise<number> {
    try {
      const logs = await this.getLogsForMedication(medicationId);
      const medication = (await this.getAllMedications()).find(m => m.id === medicationId);
      
      if (!medication) return 0;

      const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
      const recentLogs = logs.filter(log => log.timestamp >= cutoffDate);
      
      const expectedDoses = days * medication.times.length;
      const takenDoses = recentLogs.filter(log => log.taken).length;

      return expectedDoses > 0 ? (takenDoses / expectedDoses) * 100 : 0;
    } catch (error) {
      console.error('Error calculating adherence rate:', error);
      return 0;
    }
  }

  /**
   * Get average effectiveness for a medication
   */
  async getAverageEffectiveness(medicationId: string, days: number = 7): Promise<number> {
    try {
      const logs = await this.getLogsForMedication(medicationId);
      const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
      const recentLogs = logs.filter(log => 
        log.timestamp >= cutoffDate && 
        log.effectiveness !== undefined
      );

      if (recentLogs.length === 0) return 0;

      const total = recentLogs.reduce((sum, log) => sum + (log.effectiveness || 0), 0);
      return total / recentLogs.length;
    } catch (error) {
      console.error('Error calculating average effectiveness:', error);
      return 0;
    }
  }

  /**
   * Clear all medication data
   */
  async clearAllData(): Promise<void> {
    try {
      // Cancel all reminders
      const medications = await this.getAllMedications();
      for (const medication of medications) {
        await this.cancelReminders(medication);
      }

      // Clear storage
      await AsyncStorage.multiRemove([
        MEDICATIONS_KEY,
        MEDICATION_LOGS_KEY,
        SIDE_EFFECTS_KEY,
      ]);
    } catch (error) {
      console.error('Error clearing medication data:', error);
    }
  }
}

export const medicationTracker = new MedicationTrackerService();
