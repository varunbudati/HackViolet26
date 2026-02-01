import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Modal,
  Alert,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { router, useFocusEffect } from 'expo-router';
import { useSocialStore } from '../../src/stores/socialStore';
import { useAuthStore } from '../../src/stores/authStore';
import { RideRequest, SocialPost } from '../../src/types';
import { Colors, BorderRadius, Typography, Spacing, Shadows, Gradients } from '../../src/components/ui/theme';
import { getConversations, ConversationPreview } from '../../src/services/api/messages';

export default function SocialScreen() {
  const { user, loadDemoUser } = useAuthStore();
  const { posts, rideRequests, createRideRequest, getOpenRideRequests, matchRideRequest, getUserRideRequests, loadRides, isLoading } = useSocialStore();
  const [activeTab, setActiveTab] = useState<'feed' | 'rides' | 'messages'>('feed');
  const [showCreateRide, setShowCreateRide] = useState(false);

  // Ride request form state
  const [rideType, setRideType] = useState<'need_ride' | 'offer_ride'>('need_ride');
  const [fromLocation, setFromLocation] = useState('');
  const [toLocation, setToLocation] = useState('');

  // Messages state
  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(false);

  // Auto-load demo user for hackathon demo if not authenticated
  useEffect(() => {
    if (!user) {
      loadDemoUser();
    }
  }, [user, loadDemoUser]);

  // Load rides when component mounts or rides tab is active
  useEffect(() => {
    if (activeTab === 'rides' || activeTab === 'feed') {
      loadRides();
    }
  }, [activeTab, loadRides]);

  // Load conversations when Messages tab is active
  useEffect(() => {
    if (activeTab === 'messages') {
      loadConversations();
    }
  }, [activeTab]);

  // Reload conversations when screen comes back into focus (e.g., returning from chat)
  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'messages' && user?.id) {
        loadConversations();
      }
    }, [activeTab, user?.id])
  );

  const loadConversations = async () => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'social.tsx:loadConversations:entry',message:'loadConversations called',data:{userId:user?.id,activeTab},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
    // #endregion
    setLoadingConversations(true);
    try {
      const convos = await getConversations(user?.id);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'social.tsx:loadConversations:result',message:'Conversations loaded',data:{count:convos.length,convos:convos.map(c=>({id:c.conversationId,name:c.otherUserName}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H4'})}).catch(()=>{});
      // #endregion
      setConversations(convos);
    } catch (error) {
      console.error('Failed to load conversations:', error);
    } finally {
      setLoadingConversations(false);
    }
  };

  const allOpenRides = getOpenRideRequests();
  // Filter out current user's rides from available rides (you shouldn't see your own)
  const openRides = user ? allOpenRides.filter(r => r.userId !== user.id) : allOpenRides;
  const myRides = user ? getUserRideRequests(user.id) : [];

  // Handle connecting with a ride request
  const handleConnect = (ride: RideRequest) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to connect with other users.');
      return;
    }

    // Don't allow connecting to your own ride
    if (ride.userId === user.id) {
      Alert.alert('Your Ride', 'This is your own ride request.');
      return;
    }

    // If already matched, go directly to chat
    if (ride.status === 'matched') {
      router.push({
        pathname: '/(modals)/direct-chat',
        params: {
          recipientId: ride.userId,
          recipientName: ride.userDisplayName,
          recipientPicture: ride.userProfilePicture || '',
        },
      });
      return;
    }

    const confirmMessage = `${ride.type === 'need_ride' ? 'They need a ride' : 'They are offering a ride'} from ${ride.fromLocation} to ${ride.toLocation}.`;

    const onConfirm = () => {
      // Navigate to chat WITHOUT matching - ride stays in list until message is sent
      router.push({
        pathname: '/(modals)/direct-chat',
        params: {
          recipientId: ride.userId,
          recipientName: ride.userDisplayName,
          recipientPicture: ride.userProfilePicture || '',
          rideId: ride.id, // Pass ride ID so chat can match when message is sent
        },
      });
    };

    // Use window.confirm on web since Alert.alert doesn't work
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Connect with ${ride.userDisplayName}?\n\n${confirmMessage}`);
      if (confirmed) {
        onConfirm();
      }
    } else {
      Alert.alert(
        'Connect with ' + ride.userDisplayName + '?',
        confirmMessage,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Connect', onPress: onConfirm },
        ]
      );
    }
  };

  // Handle responding to a ride request in the feed
  const handleRespondToRide = (rideRequest: RideRequest) => {
    handleConnect(rideRequest);
  };

  const handleCreateRide = async () => {
    if (!user || !fromLocation.trim() || !toLocation.trim()) return;

    await createRideRequest(
      user.id,
      user.displayName,
      rideType,
      fromLocation.trim(),
      toLocation.trim(),
      new Date(Date.now() + 2 * 60 * 60 * 1000) // Default 2 hours from now
    );

    setFromLocation('');
    setToLocation('');
    setShowCreateRide(false);
    // Reload rides to show the new one
    loadRides();
  };

  // Render avatar with optional profile picture
  const renderAvatar = (displayName: string, profilePicture?: string) => {
    if (profilePicture) {
      return <Image source={{ uri: profilePicture }} style={styles.avatarImage} />;
    }
    return (
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {displayName.charAt(0).toUpperCase()}
        </Text>
      </View>
    );
  };

  const renderPost = (post: SocialPost) => (
    <View key={post.id} style={styles.postCard}>
      <View style={styles.postHeader}>
        {renderAvatar(post.userDisplayName, post.userProfilePicture)}
        <View style={styles.postHeaderInfo}>
          <Text style={styles.posterName}>{post.userDisplayName}</Text>
          <Text style={styles.postTime}>
            {format(new Date(post.createdAt), 'h:mm a')}
          </Text>
        </View>
        {post.type === 'ride_request' && (
          <View style={[styles.postTypeBadge, { backgroundColor: Colors.primary + '20' }]}>
            <Ionicons name="car" size={12} color={Colors.primary} />
            <Text style={[styles.postTypeBadgeText, { color: Colors.primary }]}>Ride</Text>
          </View>
        )}
      </View>
      <Text style={styles.postContent}>{post.content}</Text>

      {post.rideRequest && (
        <View style={styles.rideDetails}>
          <View style={styles.rideRoute}>
            <View style={styles.ridePoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.safe }]} />
              <Text style={styles.rideLocation}>{post.rideRequest.fromLocation}</Text>
            </View>
            <View style={styles.routeLine} />
            <View style={styles.ridePoint}>
              <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
              <Text style={styles.rideLocation}>{post.rideRequest.toLocation}</Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.respondButton}
            onPress={() => handleRespondToRide(post.rideRequest!)}
          >
            <Text style={styles.respondButtonText}>
              {post.rideRequest.type === 'need_ride' ? 'Offer Ride' : 'Request Spot'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderRideRequest = (ride: RideRequest) => (
    <View key={ride.id} style={styles.rideCard}>
      <View style={styles.rideCardHeader}>
        {renderAvatar(ride.userDisplayName, ride.userProfilePicture)}
        <View style={styles.rideCardHeaderInfo}>
          <Text style={styles.riderName}>{ride.userDisplayName}</Text>
          <View style={[styles.rideTypeBadge, {
            backgroundColor: ride.type === 'offer_ride' ? Colors.safe + '20' : Colors.secondary + '20'
          }]}>
            <Ionicons
              name={ride.type === 'offer_ride' ? 'car' : 'hand-right'}
              size={12}
              color={ride.type === 'offer_ride' ? Colors.safe : Colors.secondary}
            />
            <Text style={[styles.rideTypeBadgeText, {
              color: ride.type === 'offer_ride' ? Colors.safe : Colors.secondary
            }]}>
              {ride.type === 'offer_ride' ? 'Offering' : 'Needs Ride'}
            </Text>
          </View>
        </View>
        <Text style={styles.rideTime}>
          {format(new Date(ride.departureTime), 'h:mm a')}
        </Text>
      </View>

      <View style={styles.rideRoute}>
        <View style={styles.ridePoint}>
          <View style={[styles.routeDot, { backgroundColor: Colors.safe }]} />
          <Text style={styles.rideLocation}>{ride.fromLocation}</Text>
        </View>
        <View style={styles.routeLine} />
        <View style={styles.ridePoint}>
          <View style={[styles.routeDot, { backgroundColor: Colors.primary }]} />
          <Text style={styles.rideLocation}>{ride.toLocation}</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={[
          styles.connectButton,
          ride.status === 'matched' && styles.connectButtonMatched
        ]}
        onPress={() => handleConnect(ride)}
        disabled={ride.status === 'matched'}
      >
        <Ionicons 
          name={ride.status === 'matched' ? 'checkmark-circle' : 'chatbubble'} 
          size={16} 
          color={Colors.white} 
        />
        <Text style={styles.connectButtonText}>
          {ride.status === 'matched' ? 'Connected' : 'Connect'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderConversation = (conversation: ConversationPreview) => (
    <TouchableOpacity
      key={conversation.conversationId}
      style={styles.conversationCard}
      onPress={() => {
        router.push({
          pathname: '/(modals)/direct-chat',
          params: {
            recipientId: conversation.otherUserId,
            recipientName: conversation.otherUserName,
            recipientPicture: conversation.otherUserPicture || '',
          },
        });
      }}
    >
      {conversation.otherUserPicture ? (
        <Image source={{ uri: conversation.otherUserPicture }} style={styles.conversationAvatarImage} />
      ) : (
        <View style={styles.conversationAvatar}>
          <Text style={styles.conversationAvatarText}>
            {conversation.otherUserName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.conversationInfo}>
        <View style={styles.conversationHeader}>
          <Text style={styles.conversationName}>{conversation.otherUserName}</Text>
          <Text style={styles.conversationTime}>
            {format(new Date(conversation.lastMessageAt), 'h:mm a')}
          </Text>
        </View>
        <Text style={styles.conversationLastMessage} numberOfLines={1}>
          {conversation.lastMessage}
        </Text>
      </View>
      {conversation.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>{conversation.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderMyRideRequest = (ride: RideRequest) => (
    <View key={ride.id} style={styles.myRideCard}>
      <View style={styles.myRideHeader}>
        <View style={[styles.myRideStatusBadge, {
          backgroundColor: ride.status === 'open' ? Colors.primary + '20' : 
                          ride.status === 'matched' ? Colors.safe + '20' : Colors.textMuted + '20'
        }]}>
          <Text style={[styles.myRideStatusText, {
            color: ride.status === 'open' ? Colors.primary : 
                   ride.status === 'matched' ? Colors.safe : Colors.textMuted
          }]}>
            {ride.status.charAt(0).toUpperCase() + ride.status.slice(1)}
          </Text>
        </View>
        <Text style={styles.myRideTime}>
          {format(new Date(ride.departureTime), 'h:mm a')}
        </Text>
      </View>
      <View style={styles.myRideRoute}>
        <Text style={styles.myRideLocation}>{ride.fromLocation}</Text>
        <Ionicons name="arrow-forward" size={14} color={Colors.textMuted} />
        <Text style={styles.myRideLocation}>{ride.toLocation}</Text>
      </View>
      {ride.status === 'matched' && (
        <TouchableOpacity
          style={styles.myRideChatButton}
          onPress={() => {
            router.push({
              pathname: '/(modals)/direct-chat',
              params: {
                recipientId: ride.matchedWith || '',
                recipientName: 'Connected User',
              },
            });
          }}
        >
          <Ionicons name="chatbubble" size={14} color={Colors.white} />
          <Text style={styles.myRideChatText}>Open Chat</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={Gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Community</Text>
        <Text style={styles.headerSubtitle}>Connect with others for safer nights</Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'feed' && styles.tabActive]}
          onPress={() => setActiveTab('feed')}
        >
          <Ionicons
            name="newspaper"
            size={18}
            color={activeTab === 'feed' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>
            Feed
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rides' && styles.tabActive]}
          onPress={() => setActiveTab('rides')}
        >
          <Ionicons
            name="car"
            size={18}
            color={activeTab === 'rides' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'rides' && styles.tabTextActive]}>
            Rides
          </Text>
          {openRides.length > 0 && (
            <View style={styles.rideBadge}>
              <Text style={styles.rideBadgeText}>{openRides.length}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'messages' && styles.tabActive]}
          onPress={() => setActiveTab('messages')}
        >
          <Ionicons
            name="chatbubbles"
            size={18}
            color={activeTab === 'messages' ? Colors.primary : Colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'messages' && styles.tabTextActive]}>
            Messages
          </Text>
          {conversations.some(c => c.unreadCount > 0) && (
            <View style={styles.rideBadge}>
              <Text style={styles.rideBadgeText}>
                {conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'feed' && posts.map(renderPost)}
        
        {activeTab === 'rides' && (
          <>
            {/* Create Ride Button */}
            <TouchableOpacity
              style={styles.createRideCard}
              onPress={() => setShowCreateRide(true)}
            >
              <View style={styles.createRideIcon}>
                <Ionicons name="add" size={24} color={Colors.primary} />
              </View>
              <View style={styles.createRideInfo}>
                <Text style={styles.createRideTitle}>Need or Offer a Ride?</Text>
                <Text style={styles.createRideSubtitle}>
                  Connect with verified users heading your way
                </Text>
              </View>
            </TouchableOpacity>

            {/* My Ride Requests Section */}
            {myRides.length > 0 && (
              <View style={styles.myRidesSection}>
                <Text style={styles.sectionTitle}>My Requests</Text>
                {myRides.map(renderMyRideRequest)}
              </View>
            )}

            {/* Available Ride Requests */}
            <Text style={styles.sectionTitle}>Available Rides</Text>
            {openRides.filter(r => r.userId !== user?.id).map(renderRideRequest)}
            {openRides.filter(r => r.userId !== user?.id).length === 0 && (
              <View style={styles.emptyState}>
                <Ionicons name="car-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyStateText}>No available rides right now</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'messages' && (
          <>
            {loadingConversations ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color={Colors.primary} size="large" />
                <Text style={styles.loadingText}>Loading conversations...</Text>
              </View>
            ) : conversations.length > 0 ? (
              conversations.map(renderConversation)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
                <Text style={styles.emptyStateText}>No messages yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Connect with someone on the Rides tab to start chatting
                </Text>
              </View>
            )}
          </>
        )}
        
        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Create Ride Modal */}
      <Modal visible={showCreateRide} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Share a Ride</Text>
              <TouchableOpacity onPress={() => setShowCreateRide(false)}>
                <Ionicons name="close" size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            {/* Ride Type Toggle */}
            <View style={styles.rideTypeToggle}>
              <TouchableOpacity
                style={[styles.rideTypeOption, rideType === 'need_ride' && styles.rideTypeOptionActive]}
                onPress={() => setRideType('need_ride')}
              >
                <Ionicons
                  name="hand-right"
                  size={20}
                  color={rideType === 'need_ride' ? Colors.white : Colors.textSecondary}
                />
                <Text style={[styles.rideTypeText, rideType === 'need_ride' && styles.rideTypeTextActive]}>
                  Need a Ride
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.rideTypeOption, rideType === 'offer_ride' && styles.rideTypeOptionActive]}
                onPress={() => setRideType('offer_ride')}
              >
                <Ionicons
                  name="car"
                  size={20}
                  color={rideType === 'offer_ride' ? Colors.white : Colors.textSecondary}
                />
                <Text style={[styles.rideTypeText, rideType === 'offer_ride' && styles.rideTypeTextActive]}>
                  Offer a Ride
                </Text>
              </TouchableOpacity>
            </View>

            {/* Location Inputs */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>From</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Starting location"
                placeholderTextColor={Colors.textMuted}
                value={fromLocation}
                onChangeText={setFromLocation}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>To</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Destination"
                placeholderTextColor={Colors.textMuted}
                value={toLocation}
                onChangeText={setToLocation}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitButton, (!fromLocation.trim() || !toLocation.trim()) && styles.submitButtonDisabled]}
              onPress={handleCreateRide}
              disabled={!fromLocation.trim() || !toLocation.trim()}
            >
              <Text style={styles.submitButtonText}>Post Request</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: Typography['2xl'],
    fontWeight: Typography.bold,
  },
  headerSubtitle: {
    color: Colors.white,
    fontSize: Typography.base,
    opacity: 0.9,
    marginTop: 4,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.primary + '20',
  },
  tabText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  tabTextActive: {
    color: Colors.primary,
  },
  rideBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginLeft: 4,
  },
  rideBadgeText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: Typography.bold,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },
  postCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  postHeaderInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  posterName: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  postTime: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  postTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  postTypeBadgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
  postContent: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    lineHeight: 20,
  },
  rideDetails: {
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  rideRoute: {
    marginBottom: Spacing.md,
  },
  ridePoint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  routeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  routeLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.border,
    marginLeft: 4,
  },
  rideLocation: {
    color: Colors.text,
    fontSize: Typography.sm,
  },
  respondButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  respondButtonText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  createRideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    borderStyle: 'dashed',
  },
  createRideIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createRideInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  createRideTitle: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  createRideSubtitle: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    marginTop: 2,
  },
  rideCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  rideCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  rideCardHeaderInfo: {
    flex: 1,
    marginLeft: Spacing.sm,
  },
  riderName: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
  },
  rideTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    gap: 4,
    marginTop: 4,
    alignSelf: 'flex-start',
  },
  rideTypeBadgeText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
  rideTime: {
    color: Colors.primary,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  connectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  connectButtonMatched: {
    backgroundColor: Colors.safe,
  },
  connectButtonText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.semibold,
  },
  bottomPadding: {
    height: Spacing.xxl,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    color: Colors.text,
    fontSize: Typography.xl,
    fontWeight: Typography.bold,
  },
  rideTypeToggle: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  rideTypeOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.sm,
  },
  rideTypeOptionActive: {
    backgroundColor: Colors.primary,
  },
  rideTypeText: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  rideTypeTextActive: {
    color: Colors.white,
  },
  formGroup: {
    marginBottom: Spacing.md,
  },
  formLabel: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
    marginBottom: Spacing.xs,
  },
  formInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    color: Colors.text,
    fontSize: Typography.base,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: Colors.white,
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  // Messages tab styles
  conversationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  conversationAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  conversationAvatarImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  conversationAvatarText: {
    color: Colors.white,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  conversationInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  conversationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  conversationName: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  conversationTime: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  conversationLastMessage: {
    color: Colors.textSecondary,
    fontSize: Typography.sm,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginLeft: Spacing.sm,
  },
  unreadBadgeText: {
    color: Colors.white,
    fontSize: Typography.xs,
    fontWeight: Typography.bold,
  },
  // My Rides section styles
  myRidesSection: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  myRideCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  myRideHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  myRideStatusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  myRideStatusText: {
    fontSize: Typography.xs,
    fontWeight: Typography.medium,
  },
  myRideTime: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  myRideRoute: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  myRideLocation: {
    color: Colors.text,
    fontSize: Typography.sm,
    flex: 1,
  },
  myRideChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.safe,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  myRideChatText: {
    color: Colors.white,
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
  },
  // Empty state and loading styles
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateText: {
    color: Colors.textMuted,
    fontSize: Typography.base,
    fontWeight: Typography.medium,
    marginTop: Spacing.md,
  },
  emptyStateSubtext: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textAlign: 'center',
    marginTop: Spacing.xs,
    maxWidth: 250,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginTop: Spacing.md,
  },
});
