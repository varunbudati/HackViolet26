import { Router, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { authMiddleware, AuthenticatedRequest } from '../middleware/auth';
import {
  isConnected,
  sendMessage,
  getConversation,
  getConversations,
  markMessagesRead,
  getConversationId,
  getUserById,
} from '../services/snowflake';

const router = Router();

// In-memory storage for demo mode
const demoMessages: Map<string, Array<{
  id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
}>> = new Map();

// All routes require authentication
router.use(authMiddleware);

// GET /api/messages - Get all conversations for current user
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!isConnected()) {
      // Demo mode - return conversations from memory
      const conversations: Array<{
        conversationId: string;
        otherUserId: string;
        otherUserName: string;
        lastMessage: string;
        lastMessageAt: Date;
        unreadCount: number;
      }> = [];

      demoMessages.forEach((messages, conversationId) => {
        const userMessages = messages.filter(
          m => m.senderId === userId || m.receiverId === userId
        );
        if (userMessages.length > 0) {
          const lastMsg = userMessages[userMessages.length - 1];
          const otherUserId = lastMsg.senderId === userId ? lastMsg.receiverId : lastMsg.senderId;
          const unread = userMessages.filter(
            m => m.receiverId === userId && !m.readAt
          ).length;
          
          conversations.push({
            conversationId,
            otherUserId,
            otherUserName: 'Demo User', // In demo mode, we don't have user names
            lastMessage: lastMsg.content,
            lastMessageAt: lastMsg.createdAt,
            unreadCount: unread,
          });
        }
      });

      res.json(conversations);
      return;
    }

    const conversations = await getConversations(userId);
    res.json(conversations.map(c => ({
      conversationId: c.CONVERSATION_ID,
      otherUserId: c.OTHER_USER_ID,
      otherUserName: c.OTHER_USER_NAME,
      lastMessage: c.LAST_MESSAGE,
      lastMessageAt: c.LAST_MESSAGE_AT,
      unreadCount: c.UNREAD_COUNT,
    })));
  } catch (error: any) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
});

// GET /api/messages/:otherUserId - Get conversation with a specific user
router.get('/:otherUserId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { otherUserId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    if (!isConnected()) {
      // Demo mode - return messages from memory
      const conversationId = getConversationId(userId, otherUserId);
      const messages = demoMessages.get(conversationId) || [];
      
      res.json(messages.map(m => ({
        id: m.id,
        conversationId: m.conversationId,
        senderId: m.senderId,
        receiverId: m.receiverId,
        content: m.content,
        createdAt: m.createdAt,
        readAt: m.readAt,
      })));
      return;
    }

    const messages = await getConversation(userId, otherUserId);
    res.json(messages.map(m => ({
      id: m.ID,
      conversationId: m.CONVERSATION_ID,
      senderId: m.SENDER_ID,
      receiverId: m.RECEIVER_ID,
      content: m.CONTENT,
      createdAt: m.CREATED_AT,
      readAt: m.READ_AT,
    })));
  } catch (error: any) {
    console.error('Get conversation error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
});

// POST /api/messages - Send a message
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      res.status(400).json({ error: 'receiverId and content are required' });
      return;
    }

    const messageId = uuidv4();
    const conversationId = getConversationId(userId, receiverId);

    if (!isConnected()) {
      // Demo mode - store in memory
      const message = {
        id: messageId,
        conversationId,
        senderId: userId,
        receiverId,
        content,
        createdAt: new Date(),
        readAt: null,
      };

      const existing = demoMessages.get(conversationId) || [];
      existing.push(message);
      demoMessages.set(conversationId, existing);

      res.status(201).json(message);
      return;
    }

    await sendMessage(messageId, userId, receiverId, content);

    res.status(201).json({
      id: messageId,
      conversationId,
      senderId: userId,
      receiverId,
      content,
      createdAt: new Date(),
      readAt: null,
    });
  } catch (error: any) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// PUT /api/messages/:otherUserId/read - Mark messages as read
router.put('/:otherUserId/read', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { otherUserId } = req.params;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const conversationId = getConversationId(userId, otherUserId);

    if (!isConnected()) {
      // Demo mode - mark messages as read in memory
      const messages = demoMessages.get(conversationId);
      if (messages) {
        messages.forEach(m => {
          if (m.receiverId === userId && !m.readAt) {
            m.readAt = new Date();
          }
        });
      }
      res.json({ message: 'Messages marked as read' });
      return;
    }

    await markMessagesRead(conversationId, userId);
    res.json({ message: 'Messages marked as read' });
  } catch (error: any) {
    console.error('Mark messages read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
});

export default router;
