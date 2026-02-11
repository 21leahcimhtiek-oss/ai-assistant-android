// Advanced Analytics Service - Recovery Metrics & Progress Tracking
// Comprehensive analytics for trauma recovery tracking and insights

import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RecoveryMetric {
  date: number;
  traumaIntensity: number; // 0-10
  anxietyLevel: number; // 0-10
  moodScore: number; // 0-10
  sleepQuality: number; // 0-10
  sessionCount: number;
  groundingExercises: number;
  emdrSessions: number;
}

export interface RecoveryScore {
  overall: number; // 0-100
  trauma: number; // 0-100
  anxiety: number; // 0-100
  mood: number; // 0-100
  sleep: number; // 0-100
  engagement: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
}

export interface AnalyticsReport {
  period: 'week' | 'month' | 'year';
  startDate: number;
  endDate: number;
  metrics: RecoveryMetric[];
  recoveryScore: RecoveryScore;
  milestones: Milestone[];
  insights: string[];
  recommendations: string[];
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  achievedDate: number;
  category: 'trauma' | 'anxiety' | 'mood' | 'sleep' | 'engagement';
  icon: string;
}

export interface TrendData {
  label: string;
  value: number;
  change: number; // percentage change
  direction: 'up' | 'down' | 'stable';
}

export const AnalyticsService = {
  // Record daily metric
  async recordMetric(metric: RecoveryMetric): Promise<void> {
    try {
      const key = `metric_${metric.date}`;
      await AsyncStorage.setItem(key, JSON.stringify(metric));
    } catch (error) {
      console.error('Error recording metric:', error);
    }
  },

  // Get metrics for date range
  async getMetrics(startDate: number, endDate: number): Promise<RecoveryMetric[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const metricKeys = allKeys.filter(key => key.startsWith('metric_'));

      const metrics: RecoveryMetric[] = [];
      for (const key of metricKeys) {
        const metric = await AsyncStorage.getItem(key);
        if (metric) {
          const parsed = JSON.parse(metric);
          if (parsed.date >= startDate && parsed.date <= endDate) {
            metrics.push(parsed);
          }
        }
      }

      return metrics.sort((a, b) => a.date - b.date);
    } catch (error) {
      console.error('Error getting metrics:', error);
      return [];
    }
  },

  // Calculate recovery score
  async calculateRecoveryScore(): Promise<RecoveryScore> {
    try {
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      const metrics = await this.getMetrics(thirtyDaysAgo, now);

      if (metrics.length === 0) {
        return {
          overall: 0,
          trauma: 0,
          anxiety: 0,
          mood: 0,
          sleep: 0,
          engagement: 0,
          trend: 'stable',
        };
      }

      // Calculate averages (inverse for intensity/anxiety)
      const avgTrauma = 100 - (metrics.reduce((sum, m) => sum + m.traumaIntensity, 0) / metrics.length) * 10;
      const avgAnxiety = 100 - (metrics.reduce((sum, m) => sum + m.anxietyLevel, 0) / metrics.length) * 10;
      const avgMood = (metrics.reduce((sum, m) => sum + m.moodScore, 0) / metrics.length) * 10;
      const avgSleep = (metrics.reduce((sum, m) => sum + m.sleepQuality, 0) / metrics.length) * 10;

      // Engagement score based on activity
      const totalSessions = metrics.reduce((sum, m) => sum + m.sessionCount, 0);
      const avgEngagement = Math.min(100, (totalSessions / metrics.length) * 20);

      const overall = (avgTrauma + avgAnxiety + avgMood + avgSleep + avgEngagement) / 5;

      // Determine trend
      const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2));
      const secondHalf = metrics.slice(Math.floor(metrics.length / 2));

      const firstScore =
        (firstHalf.reduce((sum, m) => sum + m.moodScore, 0) / firstHalf.length) * 10;
      const secondScore =
        (secondHalf.reduce((sum, m) => sum + m.moodScore, 0) / secondHalf.length) * 10;

      const trend: 'improving' | 'stable' | 'declining' =
        secondScore > firstScore + 5
          ? 'improving'
          : secondScore < firstScore - 5
            ? 'declining'
            : 'stable';

      return {
        overall: Math.round(overall),
        trauma: Math.round(avgTrauma),
        anxiety: Math.round(avgAnxiety),
        mood: Math.round(avgMood),
        sleep: Math.round(avgSleep),
        engagement: Math.round(avgEngagement),
        trend,
      };
    } catch (error) {
      console.error('Error calculating recovery score:', error);
      return {
        overall: 0,
        trauma: 0,
        anxiety: 0,
        mood: 0,
        sleep: 0,
        engagement: 0,
        trend: 'stable',
      };
    }
  },

  // Generate analytics report
  async generateReport(period: 'week' | 'month' | 'year'): Promise<AnalyticsReport> {
    try {
      const now = Date.now();
      let startDate: number;

      switch (period) {
        case 'week':
          startDate = now - 7 * 24 * 60 * 60 * 1000;
          break;
        case 'month':
          startDate = now - 30 * 24 * 60 * 60 * 1000;
          break;
        case 'year':
          startDate = now - 365 * 24 * 60 * 60 * 1000;
          break;
      }

      const metrics = await this.getMetrics(startDate, now);
      const recoveryScore = await this.calculateRecoveryScore();
      const milestones = await this.getMilestones(startDate, now);
      const insights = this.generateInsights(metrics, recoveryScore);
      const recommendations = this.generateRecommendations(recoveryScore);

      return {
        period,
        startDate,
        endDate: now,
        metrics,
        recoveryScore,
        milestones,
        insights,
        recommendations,
      };
    } catch (error) {
      console.error('Error generating report:', error);
      return {
        period: 'month',
        startDate: 0,
        endDate: Date.now(),
        metrics: [],
        recoveryScore: {
          overall: 0,
          trauma: 0,
          anxiety: 0,
          mood: 0,
          sleep: 0,
          engagement: 0,
          trend: 'stable',
        },
        milestones: [],
        insights: [],
        recommendations: [],
      };
    }
  },

  // Get trend data
  async getTrendData(): Promise<TrendData[]> {
    try {
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
      const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

      const recentMetrics = await this.getMetrics(thirtyDaysAgo, now);
      const previousMetrics = await this.getMetrics(sixtyDaysAgo, thirtyDaysAgo);

      const calculateAvg = (metrics: RecoveryMetric[], field: keyof RecoveryMetric) =>
        metrics.length > 0
          ? metrics.reduce((sum, m) => sum + (m[field] as number), 0) / metrics.length
          : 0;

      const trends: TrendData[] = [
        {
          label: 'Trauma Intensity',
          value: 100 - calculateAvg(recentMetrics, 'traumaIntensity') * 10,
          change:
            (100 - calculateAvg(previousMetrics, 'traumaIntensity') * 10) -
            (100 - calculateAvg(recentMetrics, 'traumaIntensity') * 10),
          direction:
            calculateAvg(recentMetrics, 'traumaIntensity') <
            calculateAvg(previousMetrics, 'traumaIntensity')
              ? 'down'
              : 'up',
        },
        {
          label: 'Anxiety Level',
          value: 100 - calculateAvg(recentMetrics, 'anxietyLevel') * 10,
          change:
            (100 - calculateAvg(previousMetrics, 'anxietyLevel') * 10) -
            (100 - calculateAvg(recentMetrics, 'anxietyLevel') * 10),
          direction:
            calculateAvg(recentMetrics, 'anxietyLevel') <
            calculateAvg(previousMetrics, 'anxietyLevel')
              ? 'down'
              : 'up',
        },
        {
          label: 'Mood Score',
          value: calculateAvg(recentMetrics, 'moodScore') * 10,
          change:
            calculateAvg(recentMetrics, 'moodScore') * 10 -
            calculateAvg(previousMetrics, 'moodScore') * 10,
          direction:
            calculateAvg(recentMetrics, 'moodScore') >
            calculateAvg(previousMetrics, 'moodScore')
              ? 'up'
              : 'down',
        },
        {
          label: 'Sleep Quality',
          value: calculateAvg(recentMetrics, 'sleepQuality') * 10,
          change:
            calculateAvg(recentMetrics, 'sleepQuality') * 10 -
            calculateAvg(previousMetrics, 'sleepQuality') * 10,
          direction:
            calculateAvg(recentMetrics, 'sleepQuality') >
            calculateAvg(previousMetrics, 'sleepQuality')
              ? 'up'
              : 'down',
        },
      ];

      return trends;
    } catch (error) {
      console.error('Error getting trend data:', error);
      return [];
    }
  },

  // Add milestone
  async addMilestone(milestone: Milestone): Promise<void> {
    try {
      const key = `milestone_${milestone.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(milestone));
    } catch (error) {
      console.error('Error adding milestone:', error);
    }
  },

  // Get milestones
  async getMilestones(startDate?: number, endDate?: number): Promise<Milestone[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const milestoneKeys = allKeys.filter(key => key.startsWith('milestone_'));

      const milestones: Milestone[] = [];
      for (const key of milestoneKeys) {
        const milestone = await AsyncStorage.getItem(key);
        if (milestone) {
          const parsed = JSON.parse(milestone);
          if (!startDate || !endDate || (parsed.achievedDate >= startDate && parsed.achievedDate <= endDate)) {
            milestones.push(parsed);
          }
        }
      }

      return milestones.sort((a, b) => b.achievedDate - a.achievedDate);
    } catch (error) {
      console.error('Error getting milestones:', error);
      return [];
    }
  },

  // Export report as PDF
  async exportReport(report: AnalyticsReport): Promise<string> {
    try {
      const startDate = new Date(report.startDate).toLocaleDateString();
      const endDate = new Date(report.endDate).toLocaleDateString();

      let content = `TRAUMAHEAL RECOVERY ANALYTICS REPORT
=====================================

Period: ${report.period.toUpperCase()}
From: ${startDate} To: ${endDate}

RECOVERY SCORE
==============
Overall: ${report.recoveryScore.overall}/100 (${report.recoveryScore.trend})
Trauma: ${report.recoveryScore.trauma}/100
Anxiety: ${report.recoveryScore.anxiety}/100
Mood: ${report.recoveryScore.mood}/100
Sleep: ${report.recoveryScore.sleep}/100
Engagement: ${report.recoveryScore.engagement}/100

INSIGHTS
========
${report.insights.map(insight => `• ${insight}`).join('\n')}

RECOMMENDATIONS
===============
${report.recommendations.map(rec => `• ${rec}`).join('\n')}

MILESTONES ACHIEVED
===================
${report.milestones.length > 0 ? report.milestones.map(m => `${m.icon} ${m.title}: ${new Date(m.achievedDate).toLocaleDateString()}`).join('\n') : 'No milestones yet'}

---
Generated: ${new Date().toLocaleString()}
TraumaHeal Recovery Analytics
      `;

      return content;
    } catch (error) {
      console.error('Error exporting report:', error);
      return '';
    }
  },

  // Generate insights
  generateInsights(metrics: RecoveryMetric[], score: RecoveryScore): string[] {
    const insights: string[] = [];

    if (score.trend === 'improving') {
      insights.push('Your recovery is showing positive momentum. Keep up the therapeutic work!');
    } else if (score.trend === 'declining') {
      insights.push('Your metrics suggest increased stress. Consider scheduling additional sessions.');
    }

    if (score.trauma > 70) {
      insights.push('Trauma intensity is improving. Continue with EMDR and processing work.');
    } else if (score.trauma < 40) {
      insights.push('Trauma intensity remains elevated. Professional support may be beneficial.');
    }

    if (score.anxiety > 70) {
      insights.push('Anxiety levels are well-managed. Your grounding exercises are working.');
    } else if (score.anxiety < 40) {
      insights.push('Anxiety levels are elevated. Increase grounding exercise frequency.');
    }

    if (score.sleep > 70) {
      insights.push('Sleep quality is excellent. Maintain your current sleep routine.');
    } else if (score.sleep < 40) {
      insights.push('Sleep quality needs improvement. Consider sleep hygiene adjustments.');
    }

    if (metrics.length > 0) {
      const avgEngagement = metrics.reduce((sum, m) => sum + m.sessionCount, 0) / metrics.length;
      if (avgEngagement > 3) {
        insights.push('You are highly engaged with your recovery. This consistency is key to healing.');
      }
    }

    return insights;
  },

  // Generate recommendations
  generateRecommendations(score: RecoveryScore): string[] {
    const recommendations: string[] = [];

    if (score.trauma < 60) {
      recommendations.push('Increase EMDR sessions to 3-4 times per week');
    }

    if (score.anxiety < 60) {
      recommendations.push('Practice grounding exercises daily, especially 5-4-3-2-1 technique');
    }

    if (score.mood < 60) {
      recommendations.push('Schedule video therapy sessions with a professional');
    }

    if (score.sleep < 60) {
      recommendations.push('Implement consistent sleep schedule and bedtime routine');
    }

    if (score.engagement < 50) {
      recommendations.push('Set a goal to complete 2-3 therapeutic activities daily');
    }

    if (score.overall > 75) {
      recommendations.push('Consider working with a therapist on integration and relapse prevention');
    }

    return recommendations;
  },
};

export default AnalyticsService;
