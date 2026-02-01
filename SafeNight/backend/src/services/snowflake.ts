import snowflake from 'snowflake-sdk';

// Configure Snowflake SDK to keep alive
snowflake.configure({ keepAlive: true });

let connection: snowflake.Connection | null = null;

const createConnection = (): snowflake.Connection => {
  return snowflake.createConnection({
    account: process.env.SNOWFLAKE_ACCOUNT || '',
    username: process.env.SNOWFLAKE_USER || '',
    password: process.env.SNOWFLAKE_PASSWORD || '',
    database: process.env.SNOWFLAKE_DATABASE || 'SAFENIGHT_DB',
    schema: process.env.SNOWFLAKE_SCHEMA || 'APP_DATA',
    warehouse: process.env.SNOWFLAKE_WAREHOUSE || 'COMPUTE_WH',
    role: process.env.SNOWFLAKE_ROLE || 'ACCOUNTADMIN',
    authenticator: process.env.SNOWFLAKE_AUTHENTICATOR || undefined,
  });
};

export const connect = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!process.env.SNOWFLAKE_ACCOUNT) {
      console.log('Snowflake credentials not configured, running in demo mode');
      resolve();
      return;
    }

    connection = createConnection();
    connection.connect((err) => {
      if (err) {
        console.error('Failed to connect to Snowflake:', err.message);
        reject(err);
      } else {
        console.log('Successfully connected to Snowflake (Real Database Mode)');
        resolve();
      }
    });
  });
};

export const isConnected = (): boolean => {
  return connection !== null && connection.isUp();
};

export const executeQuery = <T>(sql: string, binds: any[] = []): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    if (!connection || !connection.isUp()) {
      reject(new Error('Not connected to Snowflake'));
      return;
    }

    connection.execute({
      sqlText: sql,
      binds,
      complete: (err, stmt, rows) => {
        if (err) {
          console.error('Query execution error:', err.message);
          reject(err);
        } else {
          resolve((rows || []) as T[]);
        }
      },
    });
  });
};

// User operations
export interface SnowflakeUser {
  ID: string;
  EMAIL: string;
  PASSWORD_HASH: string;
  DISPLAY_NAME: string;
  WEIGHT: number | null;
  GENDER: string | null;
  SOS_CODE_WORD: string | null;
  SETTINGS: any;
  CREATED_AT: Date;
}

export const getUserByEmail = async (email: string): Promise<SnowflakeUser | null> => {
  const rows = await executeQuery<SnowflakeUser>(
    'SELECT * FROM USERS WHERE EMAIL = ?',
    [email]
  );
  return rows[0] || null;
};

export const getUserById = async (userId: string): Promise<SnowflakeUser | null> => {
  const rows = await executeQuery<SnowflakeUser>(
    'SELECT * FROM USERS WHERE ID = ?',
    [userId]
  );
  return rows[0] || null;
};

export const createUser = async (
  id: string,
  email: string,
  passwordHash: string,
  displayName: string
): Promise<void> => {
  const defaultSettings = JSON.stringify({
    shareLocation: true,
    allowCheckIns: true,
    autoEscalate: false,
    darkMode: true,
  });

  // Use SELECT instead of VALUES to allow PARSE_JSON function
  await executeQuery(
    `INSERT INTO USERS (ID, EMAIL, PASSWORD_HASH, DISPLAY_NAME, SETTINGS)
     SELECT ?, ?, ?, ?, PARSE_JSON(?)`,
    [id, email, passwordHash, displayName, defaultSettings]
  );
};

export const updateUser = async (
  userId: string,
  updates: Partial<{
    displayName: string;
    weight: number;
    gender: string;
    sosCodeWord: string;
    settings: any;
  }>
): Promise<void> => {
  const setClauses: string[] = [];
  const binds: any[] = [];

  if (updates.displayName !== undefined) {
    setClauses.push('DISPLAY_NAME = ?');
    binds.push(updates.displayName);
  }
  if (updates.weight !== undefined) {
    setClauses.push('WEIGHT = ?');
    binds.push(updates.weight);
  }
  if (updates.gender !== undefined) {
    setClauses.push('GENDER = ?');
    binds.push(updates.gender);
  }
  if (updates.sosCodeWord !== undefined) {
    setClauses.push('SOS_CODE_WORD = ?');
    binds.push(updates.sosCodeWord);
  }
  if (updates.settings !== undefined) {
    setClauses.push('SETTINGS = PARSE_JSON(?)');
    binds.push(JSON.stringify(updates.settings));
  }

  if (setClauses.length === 0) return;

  binds.push(userId);
  await executeQuery(
    `UPDATE USERS SET ${setClauses.join(', ')} WHERE ID = ?`,
    binds
  );
};

// Emergency contact operations
export interface SnowflakeEmergencyContact {
  ID: string;
  USER_ID: string;
  NAME: string;
  PHONE: string;
  RELATIONSHIP: string | null;
}

export const getEmergencyContacts = async (userId: string): Promise<SnowflakeEmergencyContact[]> => {
  return executeQuery<SnowflakeEmergencyContact>(
    'SELECT * FROM EMERGENCY_CONTACTS WHERE USER_ID = ?',
    [userId]
  );
};

export const addEmergencyContact = async (
  id: string,
  userId: string,
  name: string,
  phone: string,
  relationship?: string
): Promise<void> => {
  await executeQuery(
    `INSERT INTO EMERGENCY_CONTACTS (ID, USER_ID, NAME, PHONE, RELATIONSHIP)
     VALUES (?, ?, ?, ?, ?)`,
    [id, userId, name, phone, relationship || null]
  );
};

export const deleteEmergencyContact = async (contactId: string, userId: string): Promise<void> => {
  await executeQuery(
    'DELETE FROM EMERGENCY_CONTACTS WHERE ID = ? AND USER_ID = ?',
    [contactId, userId]
  );
};

// Message operations
export interface SnowflakeMessage {
  ID: string;
  CONVERSATION_ID: string;
  SENDER_ID: string;
  RECEIVER_ID: string;
  CONTENT: string;
  CREATED_AT: Date;
  READ_AT: Date | null;
}

export interface ConversationPreview {
  CONVERSATION_ID: string;
  OTHER_USER_ID: string;
  OTHER_USER_NAME: string;
  LAST_MESSAGE: string;
  LAST_MESSAGE_AT: Date;
  UNREAD_COUNT: number;
}

// Generate a consistent conversation ID from two user IDs
export const getConversationId = (userId1: string, userId2: string): string => {
  // Sort IDs to ensure consistent conversation ID regardless of who initiates
  return [userId1, userId2].sort().join('_');
};

export const sendMessage = async (
  id: string,
  senderId: string,
  receiverId: string,
  content: string
): Promise<void> => {
  const conversationId = getConversationId(senderId, receiverId);
  await executeQuery(
    `INSERT INTO MESSAGES (ID, CONVERSATION_ID, SENDER_ID, RECEIVER_ID, CONTENT)
     VALUES (?, ?, ?, ?, ?)`,
    [id, conversationId, senderId, receiverId, content]
  );
};

export const getConversation = async (
  userId1: string,
  userId2: string
): Promise<SnowflakeMessage[]> => {
  const conversationId = getConversationId(userId1, userId2);
  return executeQuery<SnowflakeMessage>(
    `SELECT * FROM MESSAGES 
     WHERE CONVERSATION_ID = ?
     ORDER BY CREATED_AT ASC`,
    [conversationId]
  );
};

export const getConversations = async (userId: string): Promise<ConversationPreview[]> => {
  // Get list of all conversations for a user with preview info
  return executeQuery<ConversationPreview>(
    `WITH UserConversations AS (
      SELECT DISTINCT CONVERSATION_ID,
             CASE WHEN SENDER_ID = ? THEN RECEIVER_ID ELSE SENDER_ID END AS OTHER_USER_ID
      FROM MESSAGES
      WHERE SENDER_ID = ? OR RECEIVER_ID = ?
    ),
    LatestMessages AS (
      SELECT m.CONVERSATION_ID, m.CONTENT AS LAST_MESSAGE, m.CREATED_AT AS LAST_MESSAGE_AT
      FROM MESSAGES m
      INNER JOIN (
        SELECT CONVERSATION_ID, MAX(CREATED_AT) AS MAX_CREATED
        FROM MESSAGES
        GROUP BY CONVERSATION_ID
      ) latest ON m.CONVERSATION_ID = latest.CONVERSATION_ID AND m.CREATED_AT = latest.MAX_CREATED
    ),
    UnreadCounts AS (
      SELECT CONVERSATION_ID, COUNT(*) AS UNREAD_COUNT
      FROM MESSAGES
      WHERE RECEIVER_ID = ? AND READ_AT IS NULL
      GROUP BY CONVERSATION_ID
    )
    SELECT uc.CONVERSATION_ID, uc.OTHER_USER_ID, u.DISPLAY_NAME AS OTHER_USER_NAME,
           lm.LAST_MESSAGE, lm.LAST_MESSAGE_AT, COALESCE(ur.UNREAD_COUNT, 0) AS UNREAD_COUNT
    FROM UserConversations uc
    JOIN USERS u ON uc.OTHER_USER_ID = u.ID
    JOIN LatestMessages lm ON uc.CONVERSATION_ID = lm.CONVERSATION_ID
    LEFT JOIN UnreadCounts ur ON uc.CONVERSATION_ID = ur.CONVERSATION_ID
    ORDER BY lm.LAST_MESSAGE_AT DESC`,
    [userId, userId, userId, userId]
  );
};

export const markMessagesRead = async (
  conversationId: string,
  userId: string
): Promise<void> => {
  await executeQuery(
    `UPDATE MESSAGES 
     SET READ_AT = CURRENT_TIMESTAMP()
     WHERE CONVERSATION_ID = ? AND RECEIVER_ID = ? AND READ_AT IS NULL`,
    [conversationId, userId]
  );
};

// Ride Request operations
export interface SnowflakeRideRequest {
  ID: string;
  USER_ID: string;
  USER_DISPLAY_NAME: string;
  TYPE: 'need_ride' | 'offer_ride';
  FROM_LOCATION: string;
  TO_LOCATION: string;
  DEPARTURE_TIME: Date;
  MAX_PASSENGERS: number | null;
  STATUS: 'open' | 'matched' | 'completed' | 'cancelled';
  MATCHED_WITH: string | null;
  CREATED_AT: Date;
}

export const createRideRequest = async (
  id: string,
  userId: string,
  userDisplayName: string,
  type: 'need_ride' | 'offer_ride',
  fromLocation: string,
  toLocation: string,
  departureTime: Date,
  maxPassengers?: number
): Promise<void> => {
  await executeQuery(
    `INSERT INTO RIDE_REQUESTS (ID, USER_ID, USER_DISPLAY_NAME, TYPE, FROM_LOCATION, TO_LOCATION, DEPARTURE_TIME, MAX_PASSENGERS)
     SELECT ?, ?, ?, ?, ?, ?, ?, ?`,
    [id, userId, userDisplayName, type, fromLocation, toLocation, departureTime.toISOString(), maxPassengers || null]
  );
};

export const getOpenRideRequests = async (): Promise<SnowflakeRideRequest[]> => {
  return executeQuery<SnowflakeRideRequest>(
    `SELECT * FROM RIDE_REQUESTS WHERE STATUS = 'open' ORDER BY CREATED_AT DESC`
  );
};

export const getUserRideRequests = async (userId: string): Promise<SnowflakeRideRequest[]> => {
  return executeQuery<SnowflakeRideRequest>(
    `SELECT * FROM RIDE_REQUESTS WHERE USER_ID = ? ORDER BY CREATED_AT DESC`,
    [userId]
  );
};

export const matchRideRequest = async (requestId: string, matchedUserId: string): Promise<void> => {
  await executeQuery(
    `UPDATE RIDE_REQUESTS SET STATUS = 'matched', MATCHED_WITH = ? WHERE ID = ?`,
    [matchedUserId, requestId]
  );
};

export const cancelRideRequest = async (requestId: string): Promise<void> => {
  await executeQuery(
    `UPDATE RIDE_REQUESTS SET STATUS = 'cancelled' WHERE ID = ?`,
    [requestId]
  );
};

export const completeRideRequest = async (requestId: string): Promise<void> => {
  await executeQuery(
    `UPDATE RIDE_REQUESTS SET STATUS = 'completed' WHERE ID = ?`,
    [requestId]
  );
};
