import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  FlatList,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import {
  communityService,
  type SupportGroup,
  type GroupPost,
  type AnonymousProfile,
} from '@/lib/community';

export default function CommunityScreen() {
  const [view, setView] = useState<'groups' | 'group' | 'post'>('groups');
  const [groups, setGroups] = useState<SupportGroup[]>([]);
  const [joinedGroups, setJoinedGroups] = useState<string[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<SupportGroup | null>(null);
  const [posts, setPosts] = useState<GroupPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [profile, setProfile] = useState<AnonymousProfile | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [allGroups, joined, userProfile] = await Promise.all([
        communityService.getAllGroups(),
        communityService.getJoinedGroups(),
        communityService.getAnonymousProfile(),
      ]);
      setGroups(allGroups);
      setJoinedGroups(joined);
      setProfile(userProfile);
    } catch (error) {
      Alert.alert('Error', 'Failed to load community data');
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await communityService.joinGroup(groupId);
      setJoinedGroups([...joinedGroups, groupId]);
      Alert.alert('Success', 'Joined support group');
    } catch (error) {
      Alert.alert('Error', 'Failed to join group');
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await communityService.leaveGroup(groupId);
      setJoinedGroups(joinedGroups.filter(id => id !== groupId));
      Alert.alert('Success', 'Left support group');
    } catch (error) {
      Alert.alert('Error', 'Failed to leave group');
    }
  };

  const handleOpenGroup = async (group: SupportGroup) => {
    try {
      setSelectedGroup(group);
      const groupPosts = await communityService.getAllPosts(group.id);
      setPosts(groupPosts);
      setView('group');
    } catch (error) {
      Alert.alert('Error', 'Failed to load posts');
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim() || !selectedGroup) return;

    setLoading(true);
    try {
      const post = await communityService.createPost(selectedGroup.id, newPostContent);
      
      if (post.isModerated) {
        Alert.alert(
          'Post Flagged',
          `Your post was flagged by our AI moderator: ${post.moderationReason}\\n\\nPlease review our community guidelines and try again.`
        );
      } else {
        setPosts([post, ...posts]);
        setNewPostContent('');
        Alert.alert('Success', 'Post created successfully');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  const handleLikePost = async (postId: string) => {
    if (!selectedGroup) return;
    try {
      await communityService.likePost(selectedGroup.id, postId);
      const updated = posts.map(p =>
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      );
      setPosts(updated);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (view === 'groups') {
    return (
      <ScreenContainer className="p-4">
        <ScrollView>
          {/* Header */}
          <View className="mb-6">
            <Text className="text-3xl font-bold text-foreground mb-2">
              Community Support
            </Text>
            <Text className="text-base text-muted">
              Connect with others in anonymous, AI-moderated support groups
            </Text>
          </View>

          {/* Anonymous Profile */}
          {profile && (
            <View className="bg-surface rounded-2xl p-5 border border-border mb-6">
              <Text className="text-sm text-muted mb-2">Your Anonymous Identity</Text>
              <View className="flex-row items-center">
                <Text className="text-3xl mr-3">{profile.avatar}</Text>
                <View>
                  <Text className="text-lg font-semibold text-foreground">
                    {profile.displayName}
                  </Text>
                  <Text className="text-sm text-muted">
                    Karma: {profile.karma} • Member since {new Date(profile.joinedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            </View>
          )}

          {/* Joined Groups */}
          {joinedGroups.length > 0 && (
            <View className="mb-6">
              <Text className="text-xl font-bold text-foreground mb-3">
                My Groups
              </Text>
              {groups
                .filter(g => joinedGroups.includes(g.id))
                .map(group => (
                  <TouchableOpacity
                    key={group.id}
                    className="bg-surface rounded-2xl p-5 border border-border mb-3"
                    onPress={() => handleOpenGroup(group)}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-start">
                      <Text className="text-3xl mr-3">{group.icon}</Text>
                      <View className="flex-1">
                        <Text className="text-lg font-semibold text-foreground mb-1">
                          {group.name}
                        </Text>
                        <Text className="text-sm text-muted mb-2">
                          {group.description}
                        </Text>
                        <Text className="text-xs text-muted">
                          {group.memberCount.toLocaleString()} members • {group.postCount.toLocaleString()} posts
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          )}

          {/* All Groups */}
          <View className="mb-6">
            <Text className="text-xl font-bold text-foreground mb-3">
              All Support Groups
            </Text>
            {groups.map(group => {
              const isJoined = joinedGroups.includes(group.id);
              return (
                <View
                  key={group.id}
                  className="bg-surface rounded-2xl p-5 border border-border mb-3"
                >
                  <View className="flex-row items-start mb-3">
                    <Text className="text-3xl mr-3">{group.icon}</Text>
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-foreground mb-1">
                        {group.name}
                      </Text>
                      <Text className="text-sm text-muted mb-2">
                        {group.description}
                      </Text>
                      <Text className="text-xs text-muted">
                        {group.memberCount.toLocaleString()} members • {group.postCount.toLocaleString()} posts
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row gap-2">
                    {isJoined ? (
                      <>
                        <TouchableOpacity
                          className="flex-1 bg-primary py-3 rounded-xl items-center"
                          onPress={() => handleOpenGroup(group)}
                          activeOpacity={0.8}
                        >
                          <Text className="text-background font-semibold">View Posts</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          className="bg-surface border border-border py-3 px-4 rounded-xl items-center"
                          onPress={() => handleLeaveGroup(group.id)}
                          activeOpacity={0.8}
                        >
                          <Text className="text-muted font-semibold">Leave</Text>
                        </TouchableOpacity>
                      </>
                    ) : (
                      <TouchableOpacity
                        className="flex-1 bg-primary py-3 rounded-xl items-center"
                        onPress={() => handleJoinGroup(group.id)}
                        activeOpacity={0.8}
                      >
                        <Text className="text-background font-semibold">Join Group</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          {/* Community Guidelines */}
          <View className="bg-surface rounded-2xl p-5 border border-border mb-6">
            <Text className="text-lg font-bold text-foreground mb-3">
              Community Guidelines
            </Text>
            <Text className="text-sm text-muted leading-relaxed">
              • Be respectful and supportive{'\n'}
              • No medical advice - encourage professional help{'\n'}
              • Respect privacy and confidentiality{'\n'}
              • Use trigger warnings when needed{'\n'}
              • Report harmful content{'\n'}
              • All posts are AI-moderated for safety
            </Text>
          </View>
        </ScrollView>
      </ScreenContainer>
    );
  }

  if (view === 'group' && selectedGroup) {
    return (
      <ScreenContainer className="p-4">
        <View className="flex-1">
          {/* Header */}
          <View className="mb-4">
            <TouchableOpacity
              onPress={() => setView('groups')}
              activeOpacity={0.7}
            >
              <Text className="text-primary text-base mb-2">← Back to Groups</Text>
            </TouchableOpacity>
            <View className="flex-row items-center mb-2">
              <Text className="text-3xl mr-3">{selectedGroup.icon}</Text>
              <Text className="text-2xl font-bold text-foreground flex-1">
                {selectedGroup.name}
              </Text>
            </View>
            <Text className="text-sm text-muted">
              {selectedGroup.memberCount.toLocaleString()} members
            </Text>
          </View>

          {/* New Post */}
          <View className="bg-surface rounded-2xl p-4 border border-border mb-4">
            <TextInput
              className="bg-background border border-border rounded-xl p-3 text-foreground mb-3"
              placeholder="Share your thoughts or ask for support..."
              placeholderTextColor="#9BA1A6"
              value={newPostContent}
              onChangeText={setNewPostContent}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            <TouchableOpacity
              className="bg-primary py-3 rounded-xl items-center"
              onPress={handleCreatePost}
              disabled={loading || !newPostContent.trim()}
              activeOpacity={0.8}
              style={{ opacity: loading || !newPostContent.trim() ? 0.5 : 1 }}
            >
              <Text className="text-background font-semibold">
                {loading ? 'Posting...' : 'Post'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Posts */}
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View className="bg-surface rounded-2xl p-4 border border-border mb-3">
                {item.isModerated && (
                  <View className="bg-error/20 border border-error rounded-xl p-3 mb-3">
                    <Text className="text-error text-sm font-semibold">
                      ⚠️ Flagged by AI Moderator
                    </Text>
                    <Text className="text-error text-xs mt-1">
                      {item.moderationReason}
                    </Text>
                  </View>
                )}

                <View className="flex-row items-center mb-3">
                  <Text className="text-2xl mr-2">{item.authorAvatar}</Text>
                  <View>
                    <Text className="text-base font-semibold text-foreground">
                      {item.authorName}
                    </Text>
                    <Text className="text-xs text-muted">
                      {formatTimestamp(item.timestamp)}
                    </Text>
                  </View>
                </View>

                <Text className="text-base text-foreground leading-relaxed mb-3">
                  {item.content}
                </Text>

                <View className="flex-row items-center gap-4">
                  <TouchableOpacity
                    className="flex-row items-center"
                    onPress={() => handleLikePost(item.id)}
                    activeOpacity={0.7}
                  >
                    <Text className="text-lg mr-1">💙</Text>
                    <Text className="text-sm text-muted">{item.likes}</Text>
                  </TouchableOpacity>

                  <View className="flex-row items-center">
                    <Text className="text-lg mr-1">💬</Text>
                    <Text className="text-sm text-muted">{item.commentCount}</Text>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View className="items-center py-12">
                <Text className="text-lg text-muted">No posts yet</Text>
                <Text className="text-sm text-muted mt-2">
                  Be the first to share!
                </Text>
              </View>
            }
          />
        </View>
      </ScreenContainer>
    );
  }

  return null;
}
