import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ScreenContainer } from '@/components/screen-container';
import { therapistNetwork, type Therapist } from '@/lib/therapist-network';
import { therapistAPI, type BookingRequest } from '@/lib/therapist-api';
import { notificationService } from '@/lib/notifications';

export default function TherapistsScreen() {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | undefined>();
  const [showFilters, setShowFilters] = useState(false);
  const [bookedSessions, setBookedSessions] = useState<Array<{
    id: string;
    therapist: Therapist;
    sessionTime: Date;
    meetingLink: string;
  }>>([]);

  useEffect(() => {
    loadTherapists();
  }, []);

  const handleJoinVideoCall = async (meetingLink: string) => {
    try {
      Alert.alert(
        'Join Video Call',
        `Ready to join your therapy session?\n\nMeeting Link: ${meetingLink}`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Join',
            onPress: () => {
              // In a real app, this would open the video call interface
              console.log('Joining video call:', meetingLink);
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to join video call');
    }
  };

  const loadTherapists = async () => {
    setLoading(true);
    try {
      const data = await therapistNetwork.getAllTherapists();
      setTherapists(data);
    } catch (error) {
      console.error('Error loading therapists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const results = await therapistNetwork.searchTherapists({
        specialty: selectedSpecialty,
        teletherapyOnly: true,
      });
      setTherapists(results);
    } catch (error) {
      console.error('Error searching therapists:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async (therapist: Therapist) => {
    Alert.prompt(
      'Book Session',
      `Book a session with ${therapist.name}?\n\nEnter your preferred date and time (e.g., 2024-01-25 10:00 AM)`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Book',
          onPress: async (input?: string) => {
            try {
              const [dateStr, timeStr] = (input || '').split(' ');
              const preferredDate = new Date(dateStr);
              const preferredTime = timeStr || '10:00 AM';

              const bookingRequest: BookingRequest = {
                therapistId: therapist.id,
                patientName: 'User',
                patientEmail: 'user@example.com',
                patientPhone: '(555) 123-4567',
                preferredDate,
                preferredTime,
                sessionType: therapist.teletherapyAvailable ? 'teletherapy' : 'in-person',
                notes: '',
              };

              const confirmation = await therapistAPI.bookSession(bookingRequest);
              
              await notificationService.scheduleTherapyReminder(
                confirmation.sessionDate,
                confirmation.therapistName
              );

              // Store booked session with video call link
              if (confirmation.meetingLink) {
                setBookedSessions(prev => [...prev, {
                  id: confirmation.bookingId,
                  therapist,
                  sessionTime: confirmation.sessionDate,
                  meetingLink: confirmation.meetingLink || '',
                }]);
              }

              Alert.alert(
                'Booking Confirmed',
                `Your session with ${confirmation.therapistName} is confirmed for ${confirmation.sessionDate.toLocaleDateString()} at ${confirmation.sessionTime}.\n\n${confirmation.meetingLink ? 'You can join the video call from your booked sessions below.' : 'Location: In-person'}`,
                [
                  { text: 'OK' },
                  confirmation.meetingLink ? {
                    text: 'Join Now',
                    onPress: () => handleJoinVideoCall(confirmation.meetingLink!),
                  } : undefined,
                ].filter(Boolean) as any
              );
            } catch (error) {
              Alert.alert('Booking Failed', 'Unable to book session. Please try again.');
            }
          },
        },
      ],
      'plain-text',
      '',
      'default'
    );
  };

  const specialties = therapistNetwork.getCommonSpecialties();

  const filteredTherapists = therapists.filter(t =>
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const renderTherapist = ({ item }: { item: Therapist }) => (
    <TouchableOpacity
      className="bg-surface rounded-2xl p-4 mb-3 border border-border"
      activeOpacity={0.7}
    >
      <View className="flex-row items-start">
        <View className="w-16 h-16 rounded-full bg-primary/20 items-center justify-center mr-3">
          <Text className="text-2xl">{item.name.charAt(0)}</Text>
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-center justify-between mb-1">
            <Text className="text-lg font-semibold text-foreground">{item.name}</Text>
            {item.verified && (
              <View className="bg-primary/10 px-2 py-1 rounded">
                <Text className="text-xs text-primary">✓ Verified</Text>
              </View>
            )}
          </View>
          
          <Text className="text-sm text-muted mb-2">
            {item.credentials.join(' • ')}
          </Text>
          
          <View className="flex-row flex-wrap gap-1 mb-2">
            {item.specialties.slice(0, 3).map((specialty, index) => (
              <View key={index} className="bg-primary/10 px-2 py-1 rounded">
                <Text className="text-xs text-primary">{specialty}</Text>
              </View>
            ))}
          </View>
          
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center">
              <Text className="text-sm text-foreground mr-2">⭐ {item.rating.toFixed(1)}</Text>
              <Text className="text-xs text-muted">({item.reviewCount} reviews)</Text>
            </View>
            <Text className="text-sm font-semibold text-foreground">${item.sessionRate}/hr</Text>
          </View>
          
          <View className="flex-row items-center mt-2">
            <Text className="text-xs text-muted mr-3">
              📹 {item.teletherapyAvailable ? 'Teletherapy' : 'In-person'}
            </Text>
            <Text className="text-xs text-muted">
              {item.yearsExperience} years exp
            </Text>
          </View>
        </View>
      </View>
      
      <View className="mt-3 pt-3 border-t border-border">
        <Text className="text-sm text-muted" numberOfLines={2}>
          {item.bio}
        </Text>
      </View>
      
      <TouchableOpacity
        className="mt-3 bg-primary py-3 rounded-xl items-center"
        activeOpacity={0.8}
        onPress={() => handleBookSession(item)}
      >
        <Text className="text-background font-semibold">Book Session</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <ScreenContainer className="p-4">
      <View className="mb-4">
        <Text className="text-3xl font-bold text-foreground mb-2">Find a Therapist</Text>
        <Text className="text-base text-muted">
          Connect with licensed mental health professionals
        </Text>
      </View>

      {/* Search Bar */}
      <View className="mb-4">
        <View className="flex-row items-center bg-surface rounded-xl px-4 py-3 border border-border">
          <Text className="text-muted mr-2">🔍</Text>
          <TextInput
            className="flex-1 text-foreground"
            placeholder="Search by name or specialty..."
            placeholderTextColor="#9BA1A6"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Filter Toggle */}
      <TouchableOpacity
        className="mb-4 flex-row items-center justify-between bg-surface rounded-xl px-4 py-3 border border-border"
        onPress={() => setShowFilters(!showFilters)}
        activeOpacity={0.7}
      >
        <Text className="text-foreground font-medium">Filters</Text>
        <Text className="text-muted">{showFilters ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {/* Filters */}
      {showFilters && (
        <View className="mb-4 bg-surface rounded-xl p-4 border border-border">
          <Text className="text-sm font-semibold text-foreground mb-3">Specialties</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-3">
            <TouchableOpacity
              className={`mr-2 px-4 py-2 rounded-full ${!selectedSpecialty ? 'bg-primary' : 'bg-surface border border-border'}`}
              onPress={() => {
                setSelectedSpecialty(undefined);
                handleSearch();
              }}
              activeOpacity={0.7}
            >
              <Text className={!selectedSpecialty ? 'text-background' : 'text-foreground'}>
                All
              </Text>
            </TouchableOpacity>
            {specialties.slice(0, 8).map((specialty) => (
              <TouchableOpacity
                key={specialty}
                className={`mr-2 px-4 py-2 rounded-full ${selectedSpecialty === specialty ? 'bg-primary' : 'bg-surface border border-border'}`}
                onPress={() => {
                  setSelectedSpecialty(specialty);
                  handleSearch();
                }}
                activeOpacity={0.7}
              >
                <Text className={selectedSpecialty === specialty ? 'text-background' : 'text-foreground'}>
                  {specialty}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Therapist List */}
      {loading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#6B9BD1" />
          <Text className="text-muted mt-4">Loading therapists...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredTherapists}
          renderItem={renderTherapist}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="items-center justify-center py-12">
              <Text className="text-2xl mb-2">🔍</Text>
              <Text className="text-muted">No therapists found</Text>
            </View>
          }
        />
      )}
    </ScreenContainer>
  );
}
