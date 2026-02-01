import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '../../src/stores/authStore';
import { useSocialStore } from '../../src/stores/socialStore';
import { 
  Message, 
  getConversation, 
  sendMessage as sendMessageApi, 
  markMessagesRead,
  storeUserMetadata
} from '../../src/services/api/messages';
import { Colors, BorderRadius, Typography, Spacing, Shadows } from '../../src/components/ui/theme';
import { format } from 'date-fns';

export default function DirectChatModal() {
  const { user } = useAuthStore();
  const { matchRideRequest } = useSocialStore();
  const params = useLocalSearchParams<{ 
    recipientId: string; 
    recipientName: string;
    recipientPicture?: string;
    rideId?: string; // Optional ride ID to match when first message is sent
  }>();
  
  const recipientId = params.recipientId || '';
  const recipientName = params.recipientName || 'User';
  const recipientPicture = params.recipientPicture;
  const rideId = params.rideId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMatchedRide, setHasMatchedRide] = useState(false); // Track if ride has been matched
  const scrollViewRef = useRef<ScrollView>(null);

  // Load messages on mount and set up polling
  useEffect(() => {
    if (!user?.id || !recipientId) return;

    // Store the recipient's profile info for conversation previews
    storeUserMetadata(recipientId, recipientName, recipientPicture);

    const loadMessages = async () => {
      setIsLoading(true);
      try {
        const msgs = await getConversation(user.id, recipientId);
        setMessages(msgs);
        // Mark messages as read
        await markMessagesRead(user.id, recipientId);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();

    // Poll for new messages every 5 seconds
    const pollInterval = setInterval(async () => {
      try {
        const msgs = await getConversation(user.id, recipientId);
        setMessages(msgs);
      } catch (error) {
        console.error('Failed to poll messages:', error);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [user?.id, recipientId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isSending || !user?.id) return;

    const messageContent = input.trim();
    setInput('');
    setIsSending(true);

    try {
      // Match the ride when the FIRST message is sent (if rideId was provided)
      if (rideId && !hasMatchedRide) {
        await matchRideRequest(rideId, user.id);
        setHasMatchedRide(true);
      }
      
      // Pass sender's info so receiver can see the name in their Messages tab
      const newMessage = await sendMessageApi(
        user.id, 
        recipientId, 
        messageContent,
        user.displayName,
        user.profilePicture
      );
      if (newMessage) {
        setMessages(prev => [...prev, newMessage]);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Restore input on failure
      setInput(messageContent);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isMyMessage = message.senderId === user?.id;
    const showTimestamp = index === 0 || 
      new Date(messages[index - 1].createdAt).getTime() < 
      new Date(message.createdAt).getTime() - 5 * 60 * 1000; // 5 min gap

    return (
      <View key={message.id}>
        {showTimestamp && (
          <Text style={styles.timestamp}>
            {format(new Date(message.createdAt), 'h:mm a')}
          </Text>
        )}
        <View
          style={[
            styles.messageBubble,
            isMyMessage ? styles.myBubble : styles.theirBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isMyMessage ? styles.myText : styles.theirText,
            ]}
          >
            {message.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          {recipientPicture ? (
            <Image source={{ uri: recipientPicture }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {recipientName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View>
            <Text style={styles.headerTitle}>{recipientName}</Text>
            <Text style={styles.headerSubtitle}>Ride Share Connection</Text>
          </View>
        </View>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={100}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.primary} size="large" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Start the conversation</Text>
              <Text style={styles.emptyText}>
                Say hi to {recipientName} and coordinate your ride!
              </Text>
            </View>
          ) : (
            messages.map((msg, index) => renderMessage(msg, index))
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            placeholderTextColor={Colors.textMuted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            editable={!isSending}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || isSending) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={!input.trim() || isSending}
          >
            {isSending ? (
              <ActivityIndicator color={Colors.white} size="small" />
            ) : (
              <Ionicons
                name="send"
                size={20}
                color={input.trim() ? Colors.white : Colors.textMuted}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Quick Messages */}
        {messages.length === 0 && (
          <View style={styles.quickMessages}>
            <Text style={styles.quickMessagesTitle}>Quick messages:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={styles.quickMessageChip}
                onPress={() => setInput('Hey! Ready to coordinate our ride?')}
              >
                <Text style={styles.quickMessageText}>Hey! Ready to coordinate?</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickMessageChip}
                onPress={() => setInput("What time works best for you?")}
              >
                <Text style={styles.quickMessageText}>What time works?</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickMessageChip}
                onPress={() => setInput("Where should we meet?")}
              >
                <Text style={styles.quickMessageText}>Where to meet?</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: Typography.lg,
    fontWeight: Typography.bold,
  },
  headerTitle: {
    color: Colors.text,
    fontSize: Typography.base,
    fontWeight: Typography.semibold,
  },
  headerSubtitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
  },
  placeholder: {
    width: 40,
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xl,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxl,
  },
  loadingText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    marginTop: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.xxl,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    color: Colors.text,
    fontSize: Typography.lg,
    fontWeight: Typography.semibold,
    marginBottom: Spacing.xs,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: Typography.sm,
    textAlign: 'center',
    maxWidth: 250,
  },
  timestamp: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    textAlign: 'center',
    marginVertical: Spacing.md,
  },
  messageBubble: {
    maxWidth: SCREEN_WIDTH * 0.75,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.sm,
  },
  myBubble: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  theirBubble: {
    backgroundColor: Colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: Typography.base,
    lineHeight: 22,
  },
  myText: {
    color: Colors.white,
  },
  theirText: {
    color: Colors.text,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    color: Colors.text,
    fontSize: Typography.base,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: Colors.surfaceLight,
  },
  quickMessages: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  quickMessagesTitle: {
    color: Colors.textMuted,
    fontSize: Typography.xs,
    marginBottom: Spacing.sm,
  },
  quickMessageChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.primary + '40',
    marginRight: Spacing.sm,
  },
  quickMessageText: {
    color: Colors.primary,
    fontSize: Typography.sm,
  },
});
