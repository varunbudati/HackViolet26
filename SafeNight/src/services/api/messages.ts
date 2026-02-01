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
  fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages.ts:storeUserMetadata',message:'Storing user metadata',data:{userId,displayName,cacheSize:userMetadataCache.size},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
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
  fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages.ts:getLocalConversationPreviews:entry',message:'Getting local previews',data:{currentUserId,demoMsgMapSize:demoMessages.size,conversationIds:Array.from(demoMessages.keys())},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
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
  fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages.ts:getConversations:entry',message:'getConversations called',data:{currentUserId,isApiConfigured:isApiConfigured(),demoMsgCount:demoMessages.size,metaCacheCount:userMetadataCache.size},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  
  // Always get local previews (messages may have been stored locally via fallback)
  const localPreviews = getLocalConversationPreviews(currentUserId);
  
  if (!isApiConfigured()) {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages.ts:getConversations:demoResult',message:'Returning demo previews',data:{previewCount:localPreviews.length,previews:localPreviews.map(p=>({id:p.conversationId,otherUser:p.otherUserName}))},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages.ts:getConversations:merged',message:'Merged API and local',data:{apiCount:apiPreviews.length,localCount:localPreviews.length,mergedCount:merged.length},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
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
  fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages.ts:sendMessage:entry',message:'sendMessage called',data:{currentUserId,receiverId,contentLen:content.length,isApiConfigured:isApiConfigured(),senderName},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages.ts:sendMessage:demoStored',message:'Message stored in demo mode',data:{conversationId,messageId:message.id,totalMsgsInConvo:existing.length,totalConvos:demoMessages.size},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages.ts:sendMessage:apiFallback',message:'API failed, storing locally',data:{currentUserId,receiverId,error:String(error)},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
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
    fetch('http://127.0.0.1:7242/ingest/eec1a0c1-ad0c-483b-a634-e803659aaf43',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'messages.ts:sendMessage:fallbackStored',message:'Fallback message stored',data:{conversationId,messageId:message.id,totalMsgsInConvo:existing.length,totalConvos:demoMessages.size},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H1'})}).catch(()=>{});
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
