import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  query,
  where,
  orderBy,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Chat, Message, UserDirectoryEntry, UserProfile, ParticipantSummary } from '../types/chat';

/**
 * Searches for a user in the public short ID directory by their 8-character ID.
 */
export async function findUserByShortId(shortId: string): Promise<UserDirectoryEntry | null> {
  const cleanId = shortId.trim().toUpperCase();
  if (cleanId.length !== 8) return null;

  try {
    const docRef = doc(db, 'userDirectory', cleanId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as UserDirectoryEntry;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `userDirectory/${cleanId}`);
  }
}

/**
 * Starts or opens an existing direct 1-on-1 chat between two users.
 * Uses a deterministic chatId based on sorted user IDs so only one conversation exists.
 */
export async function createOrGetDirectChat(
  currentUser: UserProfile,
  friend: UserDirectoryEntry
): Promise<string> {
  if (currentUser.userId === friend.userId) {
    throw new Error('Você não pode criar uma conversa direta consigo mesmo.');
  }

  // Deterministic chatId for 1:1 chats
  const sortedIds = [currentUser.userId, friend.userId].sort();
  const chatId = `dm_${sortedIds[0]}_${sortedIds[1]}`;
  const chatRef = doc(db, 'chats', chatId);

  // Check if chat already exists
  try {
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
      return chatId;
    }
  } catch {
    // If reading non-existent doc throws or fails, proceed to creation
  }

  const participantDetails: Record<string, ParticipantSummary> = {
    [currentUser.userId]: {
      userId: currentUser.userId,
      displayName: currentUser.displayName,
      shortId: currentUser.shortId,
      avatarColor: currentUser.avatarColor,
      photoURL: currentUser.photoURL || '',
    },
    [friend.userId]: {
      userId: friend.userId,
      displayName: friend.displayName,
      shortId: friend.shortId,
      avatarColor: friend.avatarColor,
      photoURL: friend.photoURL || '',
    },
  };

  const newChat: Partial<Chat> = {
    id: chatId,
    type: 'direct',
    name: '',
    createdBy: currentUser.userId,
    participants: sortedIds,
    participantDetails,
    lastMessageText: 'Conversa iniciada',
    lastMessageSenderId: currentUser.userId,
    lastMessageSenderName: currentUser.displayName,
    lastMessageAt: serverTimestamp(),
    unreadBy: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(chatRef, newChat, { merge: true });
    return chatId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `chats/${chatId}`);
  }
}

/**
 * Creates a new group conversation with a group name and a list of participant short IDs.
 */
export async function createGroupChat(
  currentUser: UserProfile,
  groupName: string,
  memberProfiles: UserDirectoryEntry[]
): Promise<string> {
  const cleanName = groupName.trim();
  if (!cleanName) {
    throw new Error('O grupo precisa de um nome.');
  }

  const chatId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const chatRef = doc(db, 'chats', chatId);

  const participantIds = [currentUser.userId, ...memberProfiles.map(m => m.userId)];
  // Remove duplicates
  const uniqueParticipants = Array.from(new Set(participantIds));

  const participantDetails: Record<string, ParticipantSummary> = {
    [currentUser.userId]: {
      userId: currentUser.userId,
      displayName: currentUser.displayName,
      shortId: currentUser.shortId,
      avatarColor: currentUser.avatarColor,
      photoURL: currentUser.photoURL || '',
    },
  };

  memberProfiles.forEach(m => {
    participantDetails[m.userId] = {
      userId: m.userId,
      displayName: m.displayName,
      shortId: m.shortId,
      avatarColor: m.avatarColor,
      photoURL: m.photoURL || '',
    };
  });

  try {
    const newChat: Partial<Chat> = {
      id: chatId,
      type: 'group',
      name: cleanName,
      createdBy: currentUser.userId,
      participants: uniqueParticipants,
      participantDetails,
      lastMessageText: `Grupo "${cleanName}" criado por ${currentUser.displayName}`,
      lastMessageSenderId: currentUser.userId,
      lastMessageSenderName: currentUser.displayName,
      lastMessageAt: serverTimestamp(),
      unreadBy: uniqueParticipants.filter(id => id !== currentUser.userId),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(chatRef, newChat);
    return chatId;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `chats/${chatId}`);
  }
}

/**
 * Sends a message in a chat and updates last message preview & unread indicators.
 */
export async function sendMessage(
  chat: Chat,
  currentUser: UserProfile,
  text: string
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed) return;

  const messagesColRef = collection(db, 'chats', chat.id, 'messages');
  const chatDocRef = doc(db, 'chats', chat.id);

  try {
    // 1. Add message to subcollection
    await addDoc(messagesColRef, {
      chatId: chat.id,
      senderId: currentUser.userId,
      senderName: currentUser.displayName,
      senderAvatarColor: currentUser.avatarColor,
      senderPhotoURL: currentUser.photoURL || '',
      text: trimmed,
      readBy: [currentUser.userId],
      createdAt: serverTimestamp(),
    });

    // 2. Update chat metadata and mark other participants as unread
    const otherParticipants = chat.participants.filter(id => id !== currentUser.userId);
    
    // Also make sure current user's latest name/avatar is synced in participantDetails
    const updatedParticipantDetails = {
      ...(chat.participantDetails || {}),
      [currentUser.userId]: {
        userId: currentUser.userId,
        displayName: currentUser.displayName,
        shortId: currentUser.shortId,
        avatarColor: currentUser.avatarColor,
        photoURL: currentUser.photoURL || '',
      }
    };

    await updateDoc(chatDocRef, {
      lastMessageText: trimmed,
      lastMessageSenderId: currentUser.userId,
      lastMessageSenderName: currentUser.displayName,
      lastMessageAt: serverTimestamp(),
      unreadBy: otherParticipants,
      participantDetails: updatedParticipantDetails,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `chats/${chat.id}/messages`);
  }
}

/**
 * Sends a voice audio message in a chat with base64 audio data and duration.
 */
export async function sendAudioMessage(
  chat: Chat,
  currentUser: UserProfile,
  audioBase64: string,
  durationSeconds: number
): Promise<void> {
  const messagesColRef = collection(db, 'chats', chat.id, 'messages');
  const chatDocRef = doc(db, 'chats', chat.id);

  try {
    // 1. Add audio message to subcollection
    await addDoc(messagesColRef, {
      chatId: chat.id,
      senderId: currentUser.userId,
      senderName: currentUser.displayName,
      senderAvatarColor: currentUser.avatarColor,
      senderPhotoURL: currentUser.photoURL || '',
      text: '🎤 Mensagem de voz',
      audioData: audioBase64,
      audioDuration: Math.round(durationSeconds),
      readBy: [currentUser.userId],
      createdAt: serverTimestamp(),
    });

    // 2. Update chat metadata and mark other participants as unread
    const otherParticipants = chat.participants.filter(id => id !== currentUser.userId);
    const updatedParticipantDetails = {
      ...(chat.participantDetails || {}),
      [currentUser.userId]: {
        userId: currentUser.userId,
        displayName: currentUser.displayName,
        shortId: currentUser.shortId,
        avatarColor: currentUser.avatarColor,
        photoURL: currentUser.photoURL || '',
      }
    };

    await updateDoc(chatDocRef, {
      lastMessageText: '🎤 Mensagem de voz',
      lastMessageSenderId: currentUser.userId,
      lastMessageSenderName: currentUser.displayName,
      lastMessageAt: serverTimestamp(),
      unreadBy: otherParticipants,
      participantDetails: updatedParticipantDetails,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `chats/${chat.id}/messages`);
  }
}

/**
 * Marks messages in the chat as read by current user.
 */
export async function markChatAsRead(chatId: string, currentUserId: string): Promise<void> {
  try {
    const chatDocRef = doc(db, 'chats', chatId);
    await updateDoc(chatDocRef, {
      unreadBy: arrayRemove(currentUserId),
    });
  } catch {
    // Non-critical background operation
  }
}

/**
 * Subscribes to all chats where current user is a participant.
 */
export function subscribeToUserChats(
  userId: string,
  onChatsUpdate: (chats: Chat[]) => void,
  onError: (error: any) => void
) {
  const chatsQuery = query(
    collection(db, 'chats'),
    where('participants', 'array-contains', userId)
  );

  return onSnapshot(
    chatsQuery,
    (snapshot) => {
      const chats: Chat[] = [];
      snapshot.forEach(docSnap => {
        chats.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Chat);
      });

      // Sort client-side by lastMessageAt descending to handle pending local writes cleanly
      chats.sort((a, b) => {
        const timeA = a.lastMessageAt?.toMillis ? a.lastMessageAt.toMillis() : (a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0);
        const timeB = b.lastMessageAt?.toMillis ? b.lastMessageAt.toMillis() : (b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0);
        return timeB - timeA;
      });

      onChatsUpdate(chats);
    },
    (err) => {
      onError(err);
      handleFirestoreError(err, OperationType.LIST, 'chats');
    }
  );
}

/**
 * Subscribes to messages of an active chat in chronological order.
 */
export function subscribeToMessages(
  chatId: string,
  onMessagesUpdate: (messages: Message[]) => void,
  onError: (error: any) => void
) {
  const messagesQuery = query(
    collection(db, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc'),
    limit(150)
  );

  return onSnapshot(
    messagesQuery,
    (snapshot) => {
      const messages: Message[] = [];
      snapshot.forEach(docSnap => {
        messages.push({
          id: docSnap.id,
          ...docSnap.data()
        } as Message);
      });
      onMessagesUpdate(messages);
    },
    (err) => {
      onError(err);
      handleFirestoreError(err, OperationType.LIST, `chats/${chatId}/messages`);
    }
  );
}

/**
 * Sends a message with an attached image or txt file.
 */
export async function sendMessageWithAttachment(
  chat: Chat,
  currentUser: UserProfile,
  text: string,
  attachment: {
    url: string;
    type: 'image' | 'txt';
    name: string;
    size: number;
  }
): Promise<void> {
  const messagesColRef = collection(db, 'chats', chat.id, 'messages');
  const chatDocRef = doc(db, 'chats', chat.id);

  const userTypedText = text.trim();
  const previewText = userTypedText || (attachment.type === 'image' ? '📷 Foto' : `📄 ${attachment.name}`);

  try {
    await addDoc(messagesColRef, {
      chatId: chat.id,
      senderId: currentUser.userId,
      senderName: currentUser.displayName,
      senderAvatarColor: currentUser.avatarColor,
      senderPhotoURL: currentUser.photoURL || '',
      text: userTypedText,
      attachmentUrl: attachment.url,
      attachmentType: attachment.type,
      attachmentName: attachment.name,
      attachmentSize: attachment.size,
      readBy: [currentUser.userId],
      createdAt: serverTimestamp(),
    });

    const otherParticipants = chat.participants.filter(id => id !== currentUser.userId);
    await updateDoc(chatDocRef, {
      lastMessageText: previewText,
      lastMessageSenderId: currentUser.userId,
      lastMessageSenderName: currentUser.displayName,
      lastMessageAt: serverTimestamp(),
      unreadBy: otherParticipants,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `chats/${chat.id}/messages`);
  }
}

/**
 * Edits the text of an existing message.
 */
export async function editMessage(
  chatId: string,
  messageId: string,
  newText: string
): Promise<void> {
  const trimmed = newText.trim();
  if (!trimmed) return;

  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  try {
    await updateDoc(msgRef, {
      text: trimmed,
      edited: true,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

/**
 * Deletes a message for everyone in the chat.
 */
export async function deleteMessageForEveryone(
  chatId: string,
  messageId: string
): Promise<void> {
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  try {
    await updateDoc(msgRef, {
      text: '🚫 Esta mensagem foi apagada',
      deletedForAll: true,
      attachmentUrl: '',
      audioData: '',
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

/**
 * Hides a message only for the current user.
 */
export async function hideMessageForMe(
  chatId: string,
  messageId: string,
  userId: string
): Promise<void> {
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  try {
    await updateDoc(msgRef, {
      hiddenFor: arrayUnion(userId),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}

/**
 * Toggles pinning a message for the current user.
 */
export async function togglePinMessage(
  chatId: string,
  messageId: string,
  userId: string,
  currentlyPinned: boolean
): Promise<void> {
  const msgRef = doc(db, 'chats', chatId, 'messages', messageId);
  try {
    await updateDoc(msgRef, {
      pinnedFor: currentlyPinned ? arrayRemove(userId) : arrayUnion(userId),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `chats/${chatId}/messages/${messageId}`);
  }
}
