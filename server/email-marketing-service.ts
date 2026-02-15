// Email Marketing Automation Service
// SendGrid integration for onboarding, reminders, and milestones

import sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '');

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  htmlContent: string;
  variables: string[];
}

export interface EmailCampaign {
  id: string;
  name: string;
  templateId: string;
  recipientSegment: string;
  scheduledFor?: Date;
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  sentAt?: Date;
  openRate?: number;
  clickRate?: number;
}

export interface UserEmailPreferences {
  userId: number;
  onboardingEmails: boolean;
  therapyReminders: boolean;
  milestoneNotifications: boolean;
  weeklyDigest: boolean;
  promotionalEmails: boolean;
}

export const EMAIL_TEMPLATES = {
  WELCOME: {
    id: 'welcome',
    name: 'Welcome to TherapyHub',
    subject: 'Welcome to TherapyHub - Your Mental Health Journey Starts Here',
    htmlContent: `
      <h1>Welcome to TherapyHub</h1>
      <p>Hi {{firstName}},</p>
      <p>We're excited to have you join our community of {{totalUsers}} people on their mental health journey.</p>
      <p>Here's what you can do:</p>
      <ul>
        <li>Choose from 10 specialized therapy apps</li>
        <li>Chat with our AI therapist anytime</li>
        <li>Connect with licensed professionals</li>
        <li>Track your recovery progress</li>
      </ul>
      <p><a href="{{appUrl}}/get-started">Get Started Now</a></p>
    `,
    variables: ['firstName', 'totalUsers', 'appUrl'],
  },

  THERAPY_REMINDER: {
    id: 'therapy_reminder',
    name: 'Therapy Session Reminder',
    subject: 'Your therapy session is in {{hours}} hours',
    htmlContent: `
      <h1>Therapy Session Reminder</h1>
      <p>Hi {{firstName}},</p>
      <p>You have a {{therapyType}} session scheduled with {{therapistName}} in {{hours}} hours.</p>
      <p>Session Details:</p>
      <ul>
        <li>Time: {{sessionTime}}</li>
        <li>Duration: {{duration}} minutes</li>
        <li>Type: {{therapyType}}</li>
      </ul>
      <p><a href="{{sessionUrl}}">Join Session</a></p>
    `,
    variables: ['firstName', 'therapyType', 'therapistName', 'hours', 'sessionTime', 'duration', 'sessionUrl'],
  },

  MILESTONE_ACHIEVEMENT: {
    id: 'milestone',
    name: 'Milestone Achievement',
    subject: '🎉 Congratulations! You\'ve reached {{milestoneName}}',
    htmlContent: `
      <h1>🎉 Milestone Achievement!</h1>
      <p>Hi {{firstName}},</p>
      <p>Congratulations on reaching {{milestoneName}}!</p>
      <p>Your Recovery Stats:</p>
      <ul>
        <li>Recovery Score: {{recoveryScore}}</li>
        <li>Sessions Completed: {{sessionsCompleted}}</li>
        <li>Days Active: {{daysActive}}</li>
        <li>Improvement: {{improvement}}%</li>
      </ul>
      <p>Keep up the amazing work! <a href="{{dashboardUrl}}">View Your Progress</a></p>
    `,
    variables: ['firstName', 'milestoneName', 'recoveryScore', 'sessionsCompleted', 'daysActive', 'improvement', 'dashboardUrl'],
  },

  WEEKLY_DIGEST: {
    id: 'weekly_digest',
    name: 'Weekly Digest',
    subject: 'Your Weekly Mental Health Summary',
    htmlContent: `
      <h1>Your Weekly Summary</h1>
      <p>Hi {{firstName}},</p>
      <p>Here's what happened this week:</p>
      <ul>
        <li>Sessions: {{weekSessions}}</li>
        <li>Apps Used: {{appsUsed}}</li>
        <li>Recovery Score: {{recoveryScore}}</li>
        <li>Mood Trend: {{moodTrend}}</li>
      </ul>
      <p><a href="{{dashboardUrl}}">View Full Report</a></p>
    `,
    variables: ['firstName', 'weekSessions', 'appsUsed', 'recoveryScore', 'moodTrend', 'dashboardUrl'],
  },

  CRISIS_SUPPORT: {
    id: 'crisis_support',
    name: 'Crisis Support Available',
    subject: 'We\'re Here for You - Crisis Support Available',
    htmlContent: `
      <h1>We're Here for You</h1>
      <p>Hi {{firstName}},</p>
      <p>We noticed you might be struggling. Our crisis support team is available 24/7.</p>
      <p>Resources Available:</p>
      <ul>
        <li><a href="{{crisisUrl}}">Talk to AI Therapist Now</a></li>
        <li><a href="{{videoUrl}}">Schedule Emergency Video Session</a></li>
        <li>Crisis Hotline: {{crisisNumber}}</li>
      </ul>
      <p>You're not alone. We're here to help.</p>
    `,
    variables: ['firstName', 'crisisUrl', 'videoUrl', 'crisisNumber'],
  },

  SUBSCRIPTION_UPGRADE: {
    id: 'subscription_upgrade',
    name: 'Subscription Upgrade Offer',
    subject: 'Unlock Premium Features - {{discount}}% Off',
    htmlContent: `
      <h1>Upgrade to Premium</h1>
      <p>Hi {{firstName}},</p>
      <p>You're doing great with the Free plan! Upgrade to Pro or Premium to unlock:</p>
      <ul>
        <li>Unlimited AI therapist access</li>
        <li>Video therapy sessions</li>
        <li>Wearable integration</li>
        <li>Advanced analytics</li>
      </ul>
      <p><a href="{{upgradeUrl}}">Upgrade Now - {{discount}}% Off</a></p>
    `,
    variables: ['firstName', 'discount', 'upgradeUrl'],
  },

  REENGAGEMENT: {
    id: 'reengagement',
    name: 'We Miss You',
    subject: 'We Miss You - Come Back to Your Recovery',
    htmlContent: `
      <h1>We Miss You!</h1>
      <p>Hi {{firstName}},</p>
      <p>It's been {{daysSinceActive}} days since you last used TherapyHub. Your recovery journey is important to us.</p>
      <p>What's New:</p>
      <ul>
        <li>New {{appName}} features</li>
        <li>{{newTherapists}} new therapists joined</li>
        <li>{{newFeatures}} new features</li>
      </ul>
      <p><a href="{{appUrl}}">Welcome Back</a></p>
    `,
    variables: ['firstName', 'daysSinceActive', 'appName', 'newTherapists', 'newFeatures', 'appUrl'],
  },
};

export class EmailMarketingService {
  async sendWelcomeEmail(userId: number, email: string, firstName: string): Promise<void> {
    const template = EMAIL_TEMPLATES.WELCOME;
    const totalUsers = 50000; // TODO: Get from database

    const htmlContent = this.renderTemplate(template.htmlContent, {
      firstName,
      totalUsers: totalUsers.toLocaleString(),
      appUrl: process.env.APP_URL || 'https://therapyhub.app',
    });

    await this.sendEmail(email, template.subject, htmlContent);
    await this.logEmailEvent(userId, 'welcome', 'sent');
  }

  async sendTherapyReminder(userId: number, email: string, sessionData: any): Promise<void> {
    const template = EMAIL_TEMPLATES.THERAPY_REMINDER;
    const htmlContent = this.renderTemplate(template.htmlContent, {
      firstName: sessionData.firstName,
      therapyType: sessionData.therapyType,
      therapistName: sessionData.therapistName,
      hours: sessionData.hoursUntilSession,
      sessionTime: new Date(sessionData.sessionTime).toLocaleString(),
      duration: sessionData.duration,
      sessionUrl: `${process.env.APP_URL}/session/${sessionData.sessionId}`,
    });

    await this.sendEmail(email, template.subject, htmlContent);
    await this.logEmailEvent(userId, 'therapy_reminder', 'sent');
  }

  async sendMilestoneEmail(userId: number, email: string, milestoneData: any): Promise<void> {
    const template = EMAIL_TEMPLATES.MILESTONE_ACHIEVEMENT;
    const htmlContent = this.renderTemplate(template.htmlContent, {
      firstName: milestoneData.firstName,
      milestoneName: milestoneData.milestoneName,
      recoveryScore: milestoneData.recoveryScore,
      sessionsCompleted: milestoneData.sessionsCompleted,
      daysActive: milestoneData.daysActive,
      improvement: milestoneData.improvement,
      dashboardUrl: `${process.env.APP_URL}/dashboard`,
    });

    await this.sendEmail(email, template.subject, htmlContent);
    await this.logEmailEvent(userId, 'milestone', 'sent');
  }

  async sendWeeklyDigest(userId: number, email: string, digestData: any): Promise<void> {
    const template = EMAIL_TEMPLATES.WEEKLY_DIGEST;
    const htmlContent = this.renderTemplate(template.htmlContent, {
      firstName: digestData.firstName,
      weekSessions: digestData.weekSessions,
      appsUsed: digestData.appsUsed.join(', '),
      recoveryScore: digestData.recoveryScore,
      moodTrend: digestData.moodTrend,
      dashboardUrl: `${process.env.APP_URL}/dashboard`,
    });

    await this.sendEmail(email, template.subject, htmlContent);
    await this.logEmailEvent(userId, 'weekly_digest', 'sent');
  }

  async sendCrisisEmail(userId: number, email: string, firstName: string): Promise<void> {
    const template = EMAIL_TEMPLATES.CRISIS_SUPPORT;
    const htmlContent = this.renderTemplate(template.htmlContent, {
      firstName,
      crisisUrl: `${process.env.APP_URL}/crisis`,
      videoUrl: `${process.env.APP_URL}/emergency-session`,
      crisisNumber: '988', // US Suicide & Crisis Lifeline
    });

    await this.sendEmail(email, template.subject, htmlContent);
    await this.logEmailEvent(userId, 'crisis_support', 'sent');
  }

  async sendUpgradeOffer(userId: number, email: string, userData: any): Promise<void> {
    const template = EMAIL_TEMPLATES.SUBSCRIPTION_UPGRADE;
    const discount = 20; // 20% off

    const htmlContent = this.renderTemplate(template.htmlContent, {
      firstName: userData.firstName,
      discount,
      upgradeUrl: `${process.env.APP_URL}/upgrade?discount=${discount}`,
    });

    await this.sendEmail(email, template.subject, htmlContent);
    await this.logEmailEvent(userId, 'upgrade_offer', 'sent');
  }

  async sendReengagementEmail(userId: number, email: string, userData: any): Promise<void> {
    const template = EMAIL_TEMPLATES.REENGAGEMENT;
    const daysSinceActive = Math.floor((Date.now() - userData.lastActiveTime) / (1000 * 60 * 60 * 24));

    const htmlContent = this.renderTemplate(template.htmlContent, {
      firstName: userData.firstName,
      daysSinceActive,
      appName: 'TraumaHeal',
      newTherapists: 25,
      newFeatures: 5,
      appUrl: process.env.APP_URL || 'https://therapyhub.app',
    });

    await this.sendEmail(email, template.subject, htmlContent);
    await this.logEmailEvent(userId, 'reengagement', 'sent');
  }

  private renderTemplate(template: string, variables: Record<string, any>): string {
    let content = template;
    Object.entries(variables).forEach(([key, value]) => {
      content = content.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    });
    return content;
  }

  private async sendEmail(to: string, subject: string, htmlContent: string): Promise<void> {
    try {
      await sgMail.send({
        to,
        from: process.env.SENDGRID_FROM_EMAIL || 'noreply@therapyhub.app',
        subject,
        html: htmlContent,
      });
    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  private async logEmailEvent(userId: number, eventType: string, status: string): Promise<void> {
    // TODO: Log to database
    console.log(`Email event: userId=${userId}, type=${eventType}, status=${status}`);
  }

  async createCampaign(name: string, templateId: string, recipientSegment: string, scheduledFor?: Date): Promise<EmailCampaign> {
    const campaign: EmailCampaign = {
      id: `campaign_${Date.now()}`,
      name,
      templateId,
      recipientSegment,
      scheduledFor,
      status: scheduledFor ? 'scheduled' : 'draft',
    };

    // TODO: Save to database
    return campaign;
  }

  async sendCampaign(campaignId: string): Promise<void> {
    // TODO: Fetch campaign from database
    // TODO: Get recipients based on segment
    // TODO: Send emails to all recipients
    console.log(`Campaign ${campaignId} sent`);
  }

  async getUserEmailPreferences(userId: number): Promise<UserEmailPreferences> {
    // TODO: Query from database
    return {
      userId,
      onboardingEmails: true,
      therapyReminders: true,
      milestoneNotifications: true,
      weeklyDigest: true,
      promotionalEmails: false,
    };
  }

  async updateEmailPreferences(userId: number, preferences: Partial<UserEmailPreferences>): Promise<void> {
    // TODO: Update database
    console.log(`Updated email preferences for user ${userId}`, preferences);
  }

  async unsubscribeUser(userId: number, email: string): Promise<void> {
    // TODO: Update database to mark user as unsubscribed
    // TODO: Add to SendGrid suppression list
    console.log(`Unsubscribed user ${userId} (${email})`);
  }

  async getEmailMetrics(campaignId: string): Promise<{
    sent: number;
    delivered: number;
    opened: number;
    clicked: number;
    bounced: number;
    unsubscribed: number;
  }> {
    // TODO: Query from SendGrid or database
    return {
      sent: 10000,
      delivered: 9950,
      opened: 3500,
      clicked: 1200,
      bounced: 50,
      unsubscribed: 100,
    };
  }

  async scheduleAutomatedEmails(userId: number): Promise<void> {
    // Welcome email on signup
    // Therapy reminders 24 hours before session
    // Weekly digest every Monday
    // Milestone emails on achievement
    // Reengagement email after 7 days of inactivity
    console.log(`Scheduled automated emails for user ${userId}`);
  }
}

export default new EmailMarketingService();
