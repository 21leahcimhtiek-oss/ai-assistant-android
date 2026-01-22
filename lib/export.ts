import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { moodTracker, type MoodEntry } from './mood-tracker';
import { journalService, type JournalEntry } from './journal';
import { progressService } from './progress';

/**
 * Export Service
 * Generates PDF reports from user data for sharing with therapists or personal records
 */

class ExportService {
  /**
   * Export mood history as PDF
   */
  async exportMoodHistory(): Promise<string> {
    try {
      const moods = await moodTracker.getAllMoods();
      
      const html = this.generateMoodHistoryHTML(moods);
      const { uri } = await Print.printToFileAsync({ html });
      
      return uri;
    } catch (error) {
      console.error('Error exporting mood history:', error);
      throw new Error('Failed to export mood history');
    }
  }

  /**
   * Export journal entries as PDF
   */
  async exportJournalEntries(): Promise<string> {
    try {
      const entries = await journalService.getAllEntries();
      
      const html = this.generateJournalEntriesHTML(entries);
      const { uri } = await Print.printToFileAsync({ html });
      
      return uri;
    } catch (error) {
      console.error('Error exporting journal entries:', error);
      throw new Error('Failed to export journal entries');
    }
  }

  /**
   * Export progress report as PDF
   */
  async exportProgressReport(): Promise<string> {
    try {
      const wellnessScore = await progressService.calculateWellnessScore();
      const summary = await progressService.getWeeklySummary();
      const insights = await progressService.generateInsights();
      const moods = await moodTracker.getAllMoods();
      
      const html = this.generateProgressReportHTML(wellnessScore, summary, insights, moods);
      const { uri } = await Print.printToFileAsync({ html });
      
      return uri;
    } catch (error) {
      console.error('Error exporting progress report:', error);
      throw new Error('Failed to export progress report');
    }
  }

  /**
   * Export all data as comprehensive PDF
   */
  async exportAllData(): Promise<string> {
    try {
      const moods = await moodTracker.getAllMoods();
      const journals = await journalService.getAllEntries();
      const wellnessScore = await progressService.calculateWellnessScore();
      const summary = await progressService.getWeeklySummary();
      const insights = await progressService.generateInsights();
      
      const html = this.generateComprehensiveReportHTML(moods, journals, wellnessScore, summary, insights);
      const { uri } = await Print.printToFileAsync({ html });
      
      return uri;
    } catch (error) {
      console.error('Error exporting all data:', error);
      throw new Error('Failed to export all data');
    }
  }

  /**
   * Share exported PDF file
   */
  async shareFile(uri: string): Promise<void> {
    try {
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(uri);
      } else {
        throw new Error('Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing file:', error);
      throw error;
    }
  }

  // ===== HTML GENERATION METHODS =====

  private generateMoodHistoryHTML(moods: MoodEntry[]): string {
    const sortedMoods = moods.sort((a, b) => b.timestamp - a.timestamp);
    
    const moodRows = sortedMoods.map(mood => `
      <tr>
        <td>${new Date(mood.timestamp).toLocaleDateString()}</td>
        <td>${new Date(mood.timestamp).toLocaleTimeString()}</td>
        <td style="text-align: center; font-weight: bold; color: ${this.getMoodColor(mood.moodLevel)};">
          ${mood.moodLevel}/10
        </td>
        <td>${mood.emotions.join(', ')}</td>
        <td>${mood.triggers || '-'}</td>
        <td>${mood.notes || '-'}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>MindSpace - Mood History</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #333;
            }
            h1 {
              color: #6B9BD1;
              border-bottom: 3px solid #6B9BD1;
              padding-bottom: 10px;
            }
            .header {
              margin-bottom: 30px;
            }
            .meta {
              color: #666;
              font-size: 14px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #6B9BD1;
              color: white;
              padding: 12px;
              text-align: left;
              font-weight: 600;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #ddd;
            }
            tr:hover {
              background-color: #f5f5f5;
            }
            .summary {
              background-color: #f0f7ff;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MindSpace - Mood History Report</h1>
            <p class="meta">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p class="meta">Total Entries: ${moods.length}</p>
          </div>
          
          <div class="summary">
            <h3>Summary</h3>
            <p><strong>Average Mood:</strong> ${this.calculateAverageMood(moods).toFixed(1)}/10</p>
            <p><strong>Date Range:</strong> ${moods.length > 0 ? new Date(moods[moods.length - 1].timestamp).toLocaleDateString() : 'N/A'} - ${moods.length > 0 ? new Date(moods[0].timestamp).toLocaleDateString() : 'N/A'}</p>
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Time</th>
                <th>Mood</th>
                <th>Emotions</th>
                <th>Triggers</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              ${moodRows}
            </tbody>
          </table>
        </body>
      </html>
    `;
  }

  private generateJournalEntriesHTML(entries: JournalEntry[]): string {
    const sortedEntries = entries.sort((a, b) => b.timestamp - a.timestamp);
    
    const entryBlocks = sortedEntries.map(entry => `
      <div class="entry">
        <div class="entry-header">
          <h3>${new Date(entry.timestamp).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h3>
          ${entry.mood ? `<span class="mood-badge" style="background-color: ${this.getMoodColor(entry.mood)};">Mood: ${entry.mood}/10</span>` : ''}
        </div>
        ${entry.prompt ? `<p class="prompt"><strong>Prompt:</strong> ${entry.prompt}</p>` : ''}
        <div class="entry-content">
          ${entry.content.replace(/\n/g, '<br>')}
        </div>
        ${entry.emotions && entry.emotions.length > 0 ? `<div class="tags">${entry.emotions.map((emotion: string) => `<span class="tag">${emotion}</span>`).join('')}</div>` : ''}
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>MindSpace - Journal Entries</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #333;
              line-height: 1.6;
            }
            h1 {
              color: #6B9BD1;
              border-bottom: 3px solid #6B9BD1;
              padding-bottom: 10px;
            }
            .header {
              margin-bottom: 30px;
            }
            .meta {
              color: #666;
              font-size: 14px;
            }
            .entry {
              background-color: #f9f9f9;
              padding: 20px;
              margin-bottom: 20px;
              border-radius: 8px;
              border-left: 4px solid #6B9BD1;
            }
            .entry-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 15px;
            }
            .entry-header h3 {
              margin: 0;
              color: #333;
            }
            .mood-badge {
              padding: 5px 12px;
              border-radius: 20px;
              color: white;
              font-size: 12px;
              font-weight: 600;
            }
            .prompt {
              color: #666;
              font-style: italic;
              margin-bottom: 10px;
            }
            .entry-content {
              margin-top: 10px;
              white-space: pre-wrap;
            }
            .tags {
              margin-top: 15px;
            }
            .tag {
              display: inline-block;
              background-color: #e0f0ff;
              color: #6B9BD1;
              padding: 4px 10px;
              border-radius: 12px;
              font-size: 12px;
              margin-right: 8px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MindSpace - Journal Entries</h1>
            <p class="meta">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p class="meta">Total Entries: ${entries.length}</p>
          </div>
          
          ${entryBlocks}
        </body>
      </html>
    `;
  }

  private generateProgressReportHTML(wellnessScore: any, summary: any, insights: any[], moods: MoodEntry[]): string {
    const insightsList = insights.map(insight => `
      <li>
        <strong>${insight.icon} ${insight.title}:</strong> ${insight.description}
      </li>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>MindSpace - Progress Report</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #333;
            }
            h1, h2 {
              color: #6B9BD1;
            }
            h1 {
              border-bottom: 3px solid #6B9BD1;
              padding-bottom: 10px;
            }
            .header {
              margin-bottom: 30px;
            }
            .meta {
              color: #666;
              font-size: 14px;
            }
            .score-card {
              background: linear-gradient(135deg, #6B9BD1 0%, #4A7BA7 100%);
              color: white;
              padding: 30px;
              border-radius: 12px;
              text-align: center;
              margin-bottom: 30px;
            }
            .score-value {
              font-size: 72px;
              font-weight: bold;
              margin: 10px 0;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .stat-card {
              background-color: #f0f7ff;
              padding: 20px;
              border-radius: 8px;
              text-align: center;
            }
            .stat-value {
              font-size: 32px;
              font-weight: bold;
              color: #6B9BD1;
            }
            .stat-label {
              color: #666;
              font-size: 14px;
              margin-top: 5px;
            }
            .insights {
              background-color: #f9f9f9;
              padding: 20px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .insights ul {
              list-style: none;
              padding: 0;
            }
            .insights li {
              padding: 10px 0;
              border-bottom: 1px solid #ddd;
            }
            .insights li:last-child {
              border-bottom: none;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>MindSpace - Progress Report</h1>
            <p class="meta">Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
          </div>
          
          <div class="score-card">
            <h2 style="margin: 0; color: white;">Overall Wellness Score</h2>
            <div class="score-value">${wellnessScore.overall}</div>
            <p style="margin: 0;">out of 100</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${summary.moodEntries}</div>
              <div class="stat-label">Mood Entries</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${summary.journalEntries}</div>
              <div class="stat-label">Journal Entries</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${summary.exercisesCompleted}</div>
              <div class="stat-label">Exercises Completed</div>
            </div>
          </div>
          
          <div class="insights">
            <h2>Insights & Recommendations</h2>
            <ul>
              ${insightsList}
            </ul>
          </div>
        </body>
      </html>
    `;
  }

  private generateComprehensiveReportHTML(
    moods: MoodEntry[],
    journals: JournalEntry[],
    wellnessScore: any,
    summary: any,
    insights: any[]
  ): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>MindSpace - Comprehensive Report</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #333;
            }
            h1, h2 {
              color: #6B9BD1;
            }
            .section {
              page-break-after: always;
              margin-bottom: 40px;
            }
          </style>
        </head>
        <body>
          <div class="section">
            <h1>MindSpace - Comprehensive Mental Health Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p><strong>Report Period:</strong> Last 30 days</p>
            <p><strong>Total Mood Entries:</strong> ${moods.length}</p>
            <p><strong>Total Journal Entries:</strong> ${journals.length}</p>
            <p><strong>Overall Wellness Score:</strong> ${wellnessScore.overall}/100</p>
          </div>
          
          ${this.generateProgressReportHTML(wellnessScore, summary, insights, moods)}
          ${this.generateMoodHistoryHTML(moods)}
          ${this.generateJournalEntriesHTML(journals)}
        </body>
      </html>
    `;
  }

  // ===== HELPER METHODS =====

  private getMoodColor(moodLevel: number): string {
    if (moodLevel >= 8) return '#22C55E';
    if (moodLevel >= 6) return '#6B9BD1';
    if (moodLevel >= 4) return '#F59E0B';
    return '#EF4444';
  }

  private calculateAverageMood(moods: MoodEntry[]): number {
    if (moods.length === 0) return 0;
    const sum = moods.reduce((acc, mood) => acc + mood.moodLevel, 0);
    return sum / moods.length;
  }
}

export const exportService = new ExportService();
