import AsyncStorage from '@react-native-async-storage/async-storage';
import { OpenRouterService, type ChatMessage } from './openrouter';

/**
 * Community Support Groups Service
 * Anonymous peer support with AI moderation
 */

export interface AnonymousProfile {
  id: string;
  displayName: string; // Auto-generated anonymous name
  avatar: string; // Color/emoji identifier
  joinedAt: string;
  karma: number; // Positive interactions
}

export interface SupportGroup {
  id: string;
  name: string;
  description: string;
  category: GroupCategory;
  memberCount: number;
  postCount: number;
  icon: string;
  guidelines: string[];
}

export interface GroupPost {
  id: string;
  groupId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: number;
  likes: number;
  commentCount: number;
  isModerated: boolean;
  moderationReason?: string;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  timestamp: number;
  likes: number;
  isModerated: boolean;
}

export type GroupCategory = 
  | 'anxiety'
  | 'depression'
  | 'ptsd'
  | 'addiction'
  | 'grief'
  | 'relationships'
  | 'bipolar'
  | 'eating_disorders'
  | 'ocd'
  | 'general';

const PROFILE_KEY = '@mindspace_anonymous_profile';
const POSTS_KEY = '@mindspace_community_posts';
const COMMENTS_KEY = '@mindspace_community_comments';
const JOINED_GROUPS_KEY = '@mindspace_joined_groups';

// Predefined support groups
const SUPPORT_GROUPS: SupportGroup[] = [
  {
    id: 'anxiety',
    name: 'Anxiety Support',
    description: 'Share your experiences with anxiety and learn coping strategies from others.',
    category: 'anxiety',
    memberCount: 1247,
    postCount: 3891,
    icon: '😰',
    guidelines: [
      'Be supportive and non-judgmental',
      'No medical advice - encourage professional help',
      'Respect privacy and confidentiality',
      'No triggering content without warnings',
    ],
  },
  {
    id: 'depression',
    name: 'Depression Support',
    description: 'A safe space to talk about depression and find hope together.',
    category: 'depression',
    memberCount: 2103,
    postCount: 5672,
    icon: '💙',
    guidelines: [
      'Be kind and compassionate',
      'No romanticizing mental illness',
      'Encourage professional treatment',
      'Crisis resources available in pinned post',
    ],
  },
  {
    id: 'ptsd',
    name: 'PTSD & Trauma',
    description: 'Connect with others healing from trauma and PTSD.',
    category: 'ptsd',
    memberCount: 892,
    postCount: 2341,
    icon: '🛡️',
    guidelines: [
      'Use trigger warnings for trauma content',
      'Respect boundaries and consent',
      'No graphic details of traumatic events',
      'Focus on healing and recovery',
    ],
  },
  {
    id: 'addiction',
    name: 'Addiction Recovery',
    description: 'Support for those in recovery or seeking help with addiction.',
    category: 'addiction',
    memberCount: 1456,
    postCount: 4123,
    icon: '🌱',
    guidelines: [
      'Celebrate sobriety milestones',
      'No glorifying substance use',
      'Encourage professional treatment',
      'Relapse is part of recovery - no judgment',
    ],
  },
  {
    id: 'grief',
    name: 'Grief & Loss',
    description: 'Find comfort and understanding while grieving a loss.',
    category: 'grief',
    memberCount: 678,
    postCount: 1892,
    icon: '🕊️',
    guidelines: [
      'Honor all types of grief',
      'No comparing losses',
      'Be patient with the grieving process',
      'Offer comfort, not advice',
    ],
  },
  {
    id: 'relationships',
    name: 'Relationship Support',
    description: 'Navigate relationship challenges and build healthier connections.',
    category: 'relationships',
    memberCount: 1834,
    postCount: 4567,
    icon: '💞',
    guidelines: [
      'Respect all relationship types',
      'No victim blaming',
      'Encourage healthy boundaries',
      'Domestic violence resources available',
    ],
  },
];

class CommunityService {
  /**
   * Get or create anonymous profile
   */
  async getAnonymousProfile(): Promise<AnonymousProfile> {
    try {
      const data = await AsyncStorage.getItem(PROFILE_KEY);
      if (data) {
        return JSON.parse(data);
      }

      // Generate anonymous profile
      const adjectives = ['Kind', 'Brave', 'Hopeful', 'Strong', 'Gentle', 'Wise', 'Calm', 'Bright'];
      const nouns = ['Soul', 'Heart', 'Spirit', 'Mind', 'Friend', 'Warrior', 'Seeker', 'Helper'];
      const colors = ['🔵', '🟢', '🟡', '🟣', '🟠', '🔴', '⚪', '🟤'];

      const profile: AnonymousProfile = {
        id: `anon_${Date.now()}`,
        displayName: `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`,
        avatar: colors[Math.floor(Math.random() * colors.length)],
        joinedAt: new Date().toISOString(),
        karma: 0,
      };

      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      return profile;
    } catch (error) {
      console.error('Error getting anonymous profile:', error);
      throw error;
    }
  }

  /**
   * Get all support groups
   */
  async getAllGroups(): Promise<SupportGroup[]> {
    return SUPPORT_GROUPS;
  }

  /**
   * Get a specific support group
   */
  async getGroup(groupId: string): Promise<SupportGroup | null> {
    return SUPPORT_GROUPS.find(g => g.id === groupId) || null;
  }

  /**
   * Get joined groups
   */
  async getJoinedGroups(): Promise<string[]> {
    try {
      const data = await AsyncStorage.getItem(JOINED_GROUPS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting joined groups:', error);
      return [];
    }
  }

  /**
   * Join a support group
   */
  async joinGroup(groupId: string): Promise<void> {
    try {
      const joined = await this.getJoinedGroups();
      if (!joined.includes(groupId)) {
        joined.push(groupId);
        await AsyncStorage.setItem(JOINED_GROUPS_KEY, JSON.stringify(joined));
      }
    } catch (error) {
      console.error('Error joining group:', error);
      throw error;
    }
  }

  /**
   * Leave a support group
   */
  async leaveGroup(groupId: string): Promise<void> {
    try {
      const joined = await this.getJoinedGroups();
      const filtered = joined.filter(id => id !== groupId);
      await AsyncStorage.setItem(JOINED_GROUPS_KEY, JSON.stringify(filtered));
    } catch (error) {
      console.error('Error leaving group:', error);
      throw error;
    }
  }

  /**
   * Moderate content using AI
   */
  async moderateContent(content: string): Promise<{ safe: boolean; reason?: string }> {
    try {
      const prompt = `You are a content moderator for a mental health support community. Analyze this post for:
1. Harmful content (self-harm, suicide ideation, violence)
2. Medical misinformation
3. Harassment or bullying
4. Spam or promotional content
5. Graphic/triggering content without warnings

Post: "${content}"

Respond with JSON: { "safe": true/false, "reason": "explanation if unsafe" }`;

      // Get API key from storage
      const apiKey = await AsyncStorage.getItem('@mindspace_openrouter_key');
      if (!apiKey) {
        return { safe: true }; // Default to safe if no API key
      }

      const service = new OpenRouterService(apiKey);
      const messages: ChatMessage[] = [
        { role: 'system', content: 'You are a content moderation AI. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ];

      const response = await service.chat({
        model: 'anthropic/claude-3.5-sonnet',
        messages,
        temperature: 0.3,
        maxTokens: 500,
      });

      const result = JSON.parse(response);
      return result;
    } catch (error) {
      console.error('Error moderating content:', error);
      // Default to safe if moderation fails
      return { safe: true };
    }
  }

  /**
   * Create a new post
   */
  async createPost(groupId: string, content: string): Promise<GroupPost> {
    try {
      const profile = await this.getAnonymousProfile();

      // Moderate content
      const moderation = await this.moderateContent(content);

      const post: GroupPost = {
        id: `post_${Date.now()}`,
        groupId,
        authorId: profile.id,
        authorName: profile.displayName,
        authorAvatar: profile.avatar,
        content,
        timestamp: Date.now(),
        likes: 0,
        commentCount: 0,
        isModerated: !moderation.safe,
        moderationReason: moderation.reason,
      };

      const posts = await this.getAllPosts(groupId);
      posts.unshift(post);
      await AsyncStorage.setItem(`${POSTS_KEY}_${groupId}`, JSON.stringify(posts));

      return post;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  }

  /**
   * Get all posts for a group
   */
  async getAllPosts(groupId: string): Promise<GroupPost[]> {
    try {
      const data = await AsyncStorage.getItem(`${POSTS_KEY}_${groupId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting posts:', error);
      return [];
    }
  }

  /**
   * Like a post
   */
  async likePost(groupId: string, postId: string): Promise<void> {
    try {
      const posts = await this.getAllPosts(groupId);
      const post = posts.find(p => p.id === postId);
      if (post) {
        post.likes++;
        await AsyncStorage.setItem(`${POSTS_KEY}_${groupId}`, JSON.stringify(posts));
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  }

  /**
   * Add a comment to a post
   */
  async addComment(groupId: string, postId: string, content: string): Promise<Comment> {
    try {
      const profile = await this.getAnonymousProfile();

      // Moderate content
      const moderation = await this.moderateContent(content);

      const comment: Comment = {
        id: `comment_${Date.now()}`,
        postId,
        authorId: profile.id,
        authorName: profile.displayName,
        authorAvatar: profile.avatar,
        content,
        timestamp: Date.now(),
        likes: 0,
        isModerated: !moderation.safe,
      };

      const comments = await this.getComments(postId);
      comments.push(comment);
      await AsyncStorage.setItem(`${COMMENTS_KEY}_${postId}`, JSON.stringify(comments));

      // Update comment count on post
      const posts = await this.getAllPosts(groupId);
      const post = posts.find(p => p.id === postId);
      if (post) {
        post.commentCount++;
        await AsyncStorage.setItem(`${POSTS_KEY}_${groupId}`, JSON.stringify(posts));
      }

      return comment;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  }

  /**
   * Get comments for a post
   */
  async getComments(postId: string): Promise<Comment[]> {
    try {
      const data = await AsyncStorage.getItem(`${COMMENTS_KEY}_${postId}`);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error getting comments:', error);
      return [];
    }
  }

  /**
   * Report a post or comment
   */
  async reportContent(contentId: string, reason: string): Promise<void> {
    try {
      // In a real app, this would send to a moderation queue
      console.log(`Content ${contentId} reported: ${reason}`);
      // For now, just log it
    } catch (error) {
      console.error('Error reporting content:', error);
    }
  }

  /**
   * Clear all community data
   */
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PROFILE_KEY);
      await AsyncStorage.removeItem(JOINED_GROUPS_KEY);
      // Clear posts and comments for all groups
      for (const group of SUPPORT_GROUPS) {
        await AsyncStorage.removeItem(`${POSTS_KEY}_${group.id}`);
      }
    } catch (error) {
      console.error('Error clearing community data:', error);
    }
  }
}

export const communityService = new CommunityService();
