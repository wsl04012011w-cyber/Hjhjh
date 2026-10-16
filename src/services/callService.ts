import {
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
  query,
  collection,
  where,
  getDoc
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { Chat, UserProfile, CallSession } from '../types/chat';

/**
 * Initiates a call session for a direct or group chat.
 */
export async function startCallSession(
  chat: Chat,
  currentUser: UserProfile
): Promise<string> {
  const callId = `call_${chat.id}`;
  const callDocRef = doc(db, 'calls', callId);

  const isGroup = chat.type === 'group';
  let receiverId = '';
  let receiverName = isGroup ? chat.name : 'Amigo';
  let receiverAvatarColor = '#818CF8';
  let receiverPhotoURL = '';

  if (!isGroup) {
    const otherId = chat.participants.find((id) => id !== currentUser.userId);
    if (otherId) {
      receiverId = otherId;
      const otherDetails = chat.participantDetails?.[otherId];
      if (otherDetails) {
        receiverName = otherDetails.displayName;
        receiverAvatarColor = otherDetails.avatarColor;
        receiverPhotoURL = otherDetails.photoURL || '';
      }
    }
  }

  const callData = {
    id: callId,
    chatId: chat.id,
    chatName: chat.name || '',
    isGroup,
    callerId: currentUser.userId,
    callerName: currentUser.displayName,
    callerAvatarColor: currentUser.avatarColor,
    callerPhotoURL: currentUser.photoURL || '',
    receiverId,
    receiverName,
    receiverAvatarColor,
    receiverPhotoURL,
    participants: chat.participants,
    status: 'ringing' as const,
    callerMuted: false,
    receiverMuted: false,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(callDocRef, callData);
    return callId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `calls/${callId}`);
    throw err;
  }
}

/**
 * Answers an incoming call session.
 */
export async function answerCallSession(callId: string): Promise<void> {
  const callDocRef = doc(db, 'calls', callId);
  try {
    await updateDoc(callDocRef, {
      status: 'connected',
      startedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `calls/${callId}`);
  }
}

/**
 * Declines an incoming call.
 */
export async function declineCallSession(callId: string): Promise<void> {
  const callDocRef = doc(db, 'calls', callId);
  try {
    await updateDoc(callDocRef, {
      status: 'declined',
      endedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `calls/${callId}`);
  }
}

/**
 * Ends an active call for all participants.
 */
export async function endCallSession(callId: string): Promise<void> {
  const callDocRef = doc(db, 'calls', callId);
  try {
    await updateDoc(callDocRef, {
      status: 'ended',
      endedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `calls/${callId}`);
  }
}

/**
 * Updates user mute status in the call session.
 */
export async function setCallMute(
  callId: string,
  isCaller: boolean,
  isMuted: boolean
): Promise<void> {
  const callDocRef = doc(db, 'calls', callId);
  try {
    await updateDoc(callDocRef, {
      [isCaller ? 'callerMuted' : 'receiverMuted']: isMuted,
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `calls/${callId}`);
  }
}

/**
 * Subscribes to changes on a specific call session.
 */
export function subscribeToCallSession(
  callId: string,
  onUpdate: (call: CallSession | null) => void
): () => void {
  const callDocRef = doc(db, 'calls', callId);
  return onSnapshot(
    callDocRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as CallSession);
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.warn('Call session snapshot error:', err);
      onUpdate(null);
    }
  );
}

/**
 * Subscribes to incoming ringing calls for the current user.
 */
export function subscribeToIncomingCalls(
  userId: string,
  onIncomingCall: (call: CallSession | null) => void
): () => void {
  const callsCol = collection(db, 'calls');
  // Query calls where receiverId is current user and status is ringing
  const q = query(
    callsCol,
    where('receiverId', '==', userId),
    where('status', '==', 'ringing')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      if (!snapshot.empty) {
        // Return most recent ringing call
        const docData = snapshot.docs[0].data() as CallSession;
        onIncomingCall(docData);
      } else {
        onIncomingCall(null);
      }
    },
    (err) => {
      console.warn('Error listening for incoming calls:', err);
      onIncomingCall(null);
    }
  );
}
