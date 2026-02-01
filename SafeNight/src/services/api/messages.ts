import apiClient from './client';

// Types
export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
}

export interface ConversationPreview {
  conversationId: string;
  otherUserId: string;
  otherUserName: string;
  otherUserPicture?: string;
  lastMessage: string;
  lastMessageAt: Date;
  unreadCount: number;
}

// User metadata for conversations (stores other user's profile info)
interface UserMetadata {
  userId: string;
  displayName: string;
  profilePicture?: string;
}

// In-memory storage for demo mode (when no backend is configured)
const demoMessages: Map<string, Message[]> = new Map();
// Store user metadata keyed by oderId (so we can display their name/picture in previews)
const userMetadataCache: Map<string, UserMetadata> = new Map();

// Initialize with demo conversations for hackathon demo
const initDemoData = () => {
  // Demo users with profile pictures (using randomuser.me)
  const demoUsers: UserMetadata[] = [
    { userId: 'user-1', displayName: 'Sarah M.', profilePicture: 'https://randomuser.me/api/portraits/women/1.jpg' },
    { userId: 'user-2', displayName: 'Emily K.', profilePicture: 'https://randomuser.me/api/portraits/women/2.jpg' },
    { userId: 'user-3', displayName: 'Jessica L.', profilePicture: 'https://randomuser.me/api/portraits/women/3.jpg' },
    { userId: 'user-6', displayName: 'Madison W.', profilePicture: 'https://randomuser.me/api/portraits/women/4.jpg' },
    { userId: 'user-7', displayName: 'Olivia P.', profilePicture: 'https://randomuser.me/api/portraits/women/5.jpg' },
  ];

  // Store user metadata
  demoUsers.forEach(user => userMetadataCache.set(user.userId, user));

  // Create some demo conversations (keyed by sorted user IDs)
  const createConvo = (userId1: string, userId2: string, messages: Array<{ from: string, content: string, minAgo: number }>) => {
    const convId = [userId1, userId2].sort().join('_');
    const msgs: Message[] = messages.map((m, i) => ({
      id: `demo-msg-${convId}-${i}`,
      conversationId: convId,
      senderId: m.from,
      receiverId: m.from === userId1 ? userId2 : userId1,
      content: m.content,
      createdAt: new Date(Date.now() - m.minAgo * 60 * 1000),
      readAt: new Date(Date.now() - (m.minAgo - 1) * 60 * 1000),
    }));
    demoMessages.set(convId, msgs);
  };

  // Sarah M. conversation (ride coordination)
  createConvo('demo-user-123', 'user-1', [
    { from: 'user-1', content: 'Hey! I saw you\'re heading to TOTS tonight too?', minAgo: 45 },
    { from: 'demo-user-123', content: 'Yes! Are you the one offering a ride from campus?', minAgo: 40 },
    { from: 'user-1', content: 'Yep! I can pick you up at 9:30 if that works?', minAgo: 35 },
    { from: 'demo-user-123', content: 'Perfect! I\'ll be at the Squires Student Center', minAgo: 30 },
    { from: 'user-1', content: 'See you then! Stay safe 💜', minAgo: 25 },
  ]);

  // Emily K. conversation (safety check)
  createConvo('demo-user-123', 'user-2', [
    { from: 'user-2', content: 'Hey, just checking in - you still at Sharkey\'s?', minAgo: 20 },
    { from: 'demo-user-123', content: 'Yes! Having a great time. The Cellar next!', minAgo: 15 },
    { from: 'user-2', content: 'Nice! Text me when you get there safely 🙌', minAgo: 10 },
  ]);

  // Madison W. conversation (plans)
  createConvo('demo-user-123', 'user-6', [
    { from: 'user-6', content: 'Are you going to The Milk Parlor later?', minAgo: 60 },
    { from: 'demo-user-123', content: 'Thinking about it! I heard they have live music tonight', minAgo: 55 },
    { from: 'user-6', content: 'Yes! It\'s a local band - they\'re so good!', minAgo: 50 },
  ]);
};

// Initialize demo data on module load
initDemoData();

// ============ MESSAGE SIMULATION ============
const RANDOM_MESSAGES = [
  'Hey! Are you still coming tonight? 🎉',
  'Where are you at? I\'m at Sharkey\'s!',
  'Want to share a ride home later?',
  'Just checking in - are you okay? 💜',
  'OMG this DJ is soooo good! 🎶',
  'The line at TOTS is crazy long lol',
  'Meet me by the bar!',
  'Have you tried the new cocktail menu here?',
  'Leaving in 30 - need a ride?',
  'This place is packed! 🔥',
  'Stay safe out there! Text me if you need anything',
  'I\'m heading to The Cellar next, wanna come?',
  'Don\'t forget to hydrate! 💧',
  'Where did you park? I forgot where I left my car 😅',
  'Best night ever!! 🙌',
];

const RANDOM_NAMES_FOR_MSGS = [
  'Emma S.', 'Sophia L.', 'Olivia M.', 'Ava K.', 'Isabella R.',
  'Mia T.', 'Charlotte W.', 'Amelia B.', 'Harper G.', 'Evelyn P.',
];

let messageSimulationIntervalId: ReturnType<typeof setInterval> | null = null;

// Generate a random simulated message
export const simulateIncomingMessage = (currentUserId: string): Message | null => {
  // Pick a random existing conversation or create new one
  const existingConversations = Array.from(demoMessages.keys());
  const simUserId = `sim-user-${Math.random().toString(36).substring(2, 8)}`;
  const simUserName = RANDOM_NAMES_FOR_MSGS[Math.floor(Math.random() * RANDOM_NAMES_FOR_MSGS.length)];
  // Random profile picture from randomuser.me
  const picIndex = Math.floor(Math.random() * 99) + 1;
  const simUserPicture = `https://randomuser.me/api/portraits/women/${picIndex}.jpg`;

  // Store user metadata with profile picture
  userMetadataCache.set(simUserId, { userId: simUserId, displayName: simUserName, profilePicture: simUserPicture });

  const conversationId = getConversationId(currentUserId, simUserId);
  const message: Message = {
    id: `sim-msg-${Math.random().toString(36).substring(2, 15)}`,
    conversationId,
    senderId: simUserId,
    receiverId: currentUserId,
    content: RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)],
    createdAt: new Date(),
    readAt: null,
  };

  // Add to demo messages
  const existing = demoMessages.get(conversationId) || [];
  existing.push(message);
  demoMessages.set(conversationId, existing);

  console.log(`💬 New message from ${simUserName}: ${message.content}`);
  return message;
};

// Start message simulation
export const startMessageSimulation = (currentUserId: string): void => {
  if (messageSimulationIntervalId) return;

  messageSimulationIntervalId = setInterval(() => {
    simulateIncomingMessage(currentUserId);
  }, 8000 + Math.random() * 7000); // Every 8-15 seconds
};

// Stop message simulation
export const stopMessageSimulation = (): void => {
  if (messageSimulationIntervalId) {
    clearInterval(messageSimulationIntervalId);
    messageSimulationIntervalId = null;
  }
};

const getConversationId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

/**
 * Store user metadata for displaying in conversation previews
 * Call this when opening a chat with someone
 */
export const storeUserMetadata = (
  userId: string,
  displayName: string,
  profilePicture?: string
): void => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'messages.ts:storeUserMetadata', message: 'Storing user metadata', data: { userId, displayName, cacheSize: userMetadataCache.size }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H3' }) }).catch(() => { });
  // #endregion
  userMetadataCache.set(userId, { userId, displayName, profilePicture });
};

// Check if API is configured
const isApiConfigured = (): boolean => {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL;
  return Boolean(apiUrl && apiUrl.length > 0);
};

// Helper to generate conversation previews from local storage
const getLocalConversationPreviews = (currentUserId?: string): ConversationPreview[] => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'messages.ts:getLocalConversationPreviews:entry', message: 'Getting local previews', data: { currentUserId, demoMsgMapSize: demoMessages.size, conversationIds: Array.from(demoMessages.keys()) }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H2' }) }).catch(() => { });
  // #endregion
  const previews: ConversationPreview[] = [];
  demoMessages.forEach((messages, conversationId) => {
    if (messages.length === 0) return;
    const lastMessage = messages[messages.length - 1];
    // Extract other user ID from conversation
    const userIds = conversationId.split('_');
    // Determine who the "other" user is based on currentUserId or lastMessage
    let otherUserId: string;
    if (currentUserId) {
      otherUserId = userIds[0] === currentUserId ? userIds[1] : userIds[0];
    } else {
      otherUserId = userIds[0] === lastMessage.senderId ? userIds[1] : userIds[0];
    }

    // Get stored user metadata for display
    const userMeta = userMetadataCache.get(otherUserId);

    previews.push({
      conversationId,
      otherUserId,
      otherUserName: userMeta?.displayName || 'Unknown User',
      otherUserPicture: userMeta?.profilePicture,
      lastMessage: lastMessage.content,
      lastMessageAt: lastMessage.createdAt,
      unreadCount: messages.filter(m => !m.readAt && m.receiverId === currentUserId).length,
    });
  });
  return previews.sort((a, b) =>
    new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
};

/**
 * Get all conversations for the current user
 */
export const getConversations = async (currentUserId?: string): Promise<ConversationPreview[]> => {
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'messages.ts:getConversations:entry', message: 'getConversations called', data: { currentUserId, isApiConfigured: isApiConfigured(), demoMsgCount: demoMessages.size, metaCacheCount: userMetadataCache.size }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H2' }) }).catch(() => { });
  // #endregion

  // Always get local previews (messages may have been stored locally via fallback)
  const localPreviews = getLocalConversationPreviews(currentUserId);

  if (!isApiConfigured()) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'messages.ts:getConversations:demoResult', message: 'Returning demo previews', data: { previewCount: localPreviews.length, previews: localPreviews.map(p => ({ id: p.conversationId, otherUser: p.otherUserName })) }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H2' }) }).catch(() => { });
    // #endregion
    return localPreviews;
  }

  try {
    const response = await apiClient.get<ConversationPreview[]>('/api/messages');
    const apiPreviews = response.data.map(c => ({
      ...c,
      lastMessageAt: new Date(c.lastMessageAt),
    }));

    // Merge API and local previews (local messages from fallback + API messages)
    const mergedMap = new Map<string, ConversationPreview>();
    // Add API previews first
    apiPreviews.forEach(p => mergedMap.set(p.conversationId, p));
    // Add local previews (will override API if same conversation has newer local message)
    localPreviews.forEach(p => {
      const existing = mergedMap.get(p.conversationId);
      if (!existing || new Date(p.lastMessageAt) > new Date(existing.lastMessageAt)) {
        mergedMap.set(p.conversationId, p);
      }
    });

    const merged = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'messages.ts:getConversations:merged', message: 'Merged API and local', data: { apiCount: apiPreviews.length, localCount: localPreviews.length, mergedCount: merged.length }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H2' }) }).catch(() => { });
    // #endregion
    return merged;
  } catch (error) {
    console.warn('API unavailable, using local storage for conversations:', error);
    // Fall back to local storage
    return localPreviews;
  }
};

/**
 * Get conversation with a specific user
 */
export const getConversation = async (
  currentUserId: string,
  otherUserId: string
): Promise<Message[]> => {
  const conversationId = getConversationId(currentUserId, otherUserId);
  const localMessages = demoMessages.get(conversationId) || [];

  if (!isApiConfigured()) {
    // Demo mode - return from local storage
    return localMessages;
  }

  try {
    const response = await apiClient.get<Message[]>(`/api/messages/${otherUserId}`);
    const apiMessages = response.data.map(m => ({
      ...m,
      createdAt: new Date(m.createdAt),
      readAt: m.readAt ? new Date(m.readAt) : null,
    }));

    // Merge API and local messages (local from fallback + API from server)
    const mergedMap = new Map<string, Message>();
    apiMessages.forEach(m => mergedMap.set(m.id, m));
    localMessages.forEach(m => mergedMap.set(m.id, m));

    return Array.from(mergedMap.values()).sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  } catch (error) {
    console.warn('API unavailable, using local storage for conversation:', error);
    // Fall back to local storage
    return localMessages;
  }
};

/**
 * Send a message to another user
 * @param senderName - Optional sender name to store for the receiver's conversation preview
 * @param senderPicture - Optional sender picture to store for the receiver's conversation preview
 */
export const sendMessage = async (
  currentUserId: string,
  receiverId: string,
  content: string,
  senderName?: string,
  senderPicture?: string
): Promise<Message | null> => {
  // Store sender's metadata so the receiver can see their name in conversation previews
  if (senderName) {
    storeUserMetadata(currentUserId, senderName, senderPicture);
  }
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'messages.ts:sendMessage:entry', message: 'sendMessage called', data: { currentUserId, receiverId, contentLen: content.length, isApiConfigured: isApiConfigured(), senderName }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H1' }) }).catch(() => { });
  // #endregion
  if (!isApiConfigured()) {
    // Demo mode - store locally
    const conversationId = getConversationId(currentUserId, receiverId);
    const message: Message = {
      id: Math.random().toString(36).substring(2, 15),
      conversationId,
      senderId: currentUserId,
      receiverId,
      content,
      createdAt: new Date(),
      readAt: null,
    };

    const existing = demoMessages.get(conversationId) || [];
    existing.push(message);
    demoMessages.set(conversationId, existing);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'messages.ts:sendMessage:demoStored', message: 'Message stored in demo mode', data: { conversationId, messageId: message.id, totalMsgsInConvo: existing.length, totalConvos: demoMessages.size }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H1' }) }).catch(() => { });
    // #endregion
    return message;
  }

  try {
    const response = await apiClient.post<Message>('/api/messages', {
      receiverId,
      content,
    });
    return {
      ...response.data,
      createdAt: new Date(response.data.createdAt),
      readAt: response.data.readAt ? new Date(response.data.readAt) : null,
    };
  } catch (error) {
    console.warn('API unavailable, falling back to local storage:', error);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'messages.ts:sendMessage:apiFallback', message: 'API failed, storing locally', data: { currentUserId, receiverId, error: String(error) }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H1' }) }).catch(() => { });
    // #endregion
    // Fall back to local storage when API fails (for hackathon demo)
    const conversationId = getConversationId(currentUserId, receiverId);
    const message: Message = {
      id: Math.random().toString(36).substring(2, 15),
      conversationId,
      senderId: currentUserId,
      receiverId,
      content,
      createdAt: new Date(),
      readAt: null,
    };
    const existing = demoMessages.get(conversationId) || [];
    existing.push(message);
    demoMessages.set(conversationId, existing);
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'messages.ts:sendMessage:fallbackStored', message: 'Fallback message stored', data: { conversationId, messageId: message.id, totalMsgsInConvo: existing.length, totalConvos: demoMessages.size }, timestamp: Date.now(), sessionId: 'debug-session', hypothesisId: 'H1' }) }).catch(() => { });
    // #endregion
    return message;
  }
};

/**
 * Mark messages in a conversation as read
 */
export const markMessagesRead = async (
  currentUserId: string,
  otherUserId: string
): Promise<void> => {
  // Always mark as read locally (for fallback messages)
  const conversationId = getConversationId(currentUserId, otherUserId);
  const messages = demoMessages.get(conversationId);
  if (messages) {
    messages.forEach(m => {
      if (m.receiverId === currentUserId && !m.readAt) {
        m.readAt = new Date();
      }
    });
  }

  if (!isApiConfigured()) {
    return;
  }

  try {
    await apiClient.put(`/api/messages/${otherUserId}/read`);
  } catch (error) {
    console.warn('API unavailable for marking messages read:', error);
    // Local storage already marked as read above
  }
};

/**
 * Clear demo messages (for testing)
 */
export const clearDemoMessages = (): void => {
  demoMessages.clear();
};
