export type PresenceStatus = 'online' | 'away' | 'busy' | 'offline';

export interface UserProfile {
  userId: string;
  shortId: string; // 8-character unique alphanumeric identifier
  displayName: string;
  avatarColor: string;
  photoURL?: string;
  status: PresenceStatus;
  statusMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserDirectoryEntry {
  shortId: string;
  userId: string;
  displayName: string;
  avatarColor: string;
  photoURL?: string;
  updatedAt: string;
}

export interface ParticipantSummary {
  userId: string;
  displayName: string;
  shortId: string;
  avatarColor: string;
  photoURL?: string;
}

export interface Chat {
  id: string;
  type: 'direct' | 'group';
  name: string; // Group title or empty for direct
  createdBy: string;
  participants: string[];
  participantDetails: Record<string, ParticipantSummary>;
  lastMessageText?: string;
  lastMessageSenderId?: string;
  lastMessageSenderName?: string;
  lastMessageAt?: any; // Firestore Timestamp or ISO
  unreadBy?: string[];
  readReceipts?: Record<string, any>;
  createdAt?: any;
  updatedAt?: any;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderAvatarColor?: string;
  senderPhotoURL?: string;
  text: string;
  audioData?: string; // Base64 audio Data URL
  audioDuration?: number; // Duration in seconds
  readBy: string[];
  createdAt: any;
}
