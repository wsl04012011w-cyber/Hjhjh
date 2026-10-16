import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { EmptyChatState } from './components/EmptyChatState';
import { FriendsModal } from './components/FriendsModal';
import { ProfileModal } from './components/ProfileModal';
import { Chat, CallSession } from './types/chat';
import { subscribeToUserChats } from './services/chatService';
import { 
  startCallSession, 
  answerCallSession, 
  declineCallSession, 
  subscribeToIncomingCalls, 
  subscribeToCallSession 
} from './services/callService';
import { CallModal } from './components/CallModal';
import { IncomingCallAlert } from './components/IncomingCallAlert';
import { MessageSquare, Users } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Voice Call States
  const [activeCall, setActiveCall] = useState<CallSession | null>(null);
  const [incomingCall, setIncomingCall] = useState<CallSession | null>(null);

  // Subscribe to user's chats in real time
  useEffect(() => {
    if (!currentUser) {
      setChats([]);
      setActiveChatId(null);
      return;
    }

    const unsubscribe = subscribeToUserChats(
      currentUser.uid,
      (updatedChats) => {
        setChats(updatedChats);
      },
      (error) => {
        console.error('Erro na sincronização de chats:', error);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  // Subscribe to incoming calls in real-time
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = subscribeToIncomingCalls(currentUser.uid, (call) => {
      // Don't show incoming if we're already in that call
      if (call && activeCall?.id === call.id) return;
      setIncomingCall(call);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser, activeCall?.id]);

  // Subscribe to updates on the active call session
  useEffect(() => {
    if (!activeCall?.id) return;

    const unsubscribe = subscribeToCallSession(activeCall.id, (updated) => {
      if (!updated || updated.status === 'ended' || updated.status === 'declined') {
        setActiveCall(null);
      } else {
        setActiveCall(updated);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [activeCall?.id]);

  // Handler to start a new voice call
  const handleStartCall = async (chat: Chat) => {
    if (!userProfile) return;
    try {
      const callId = await startCallSession(chat, userProfile);
      const isGroup = chat.type === 'group';
      const otherId = chat.participants.find((id) => id !== userProfile.userId) || '';
      const otherDetails = chat.participantDetails?.[otherId];

      setActiveCall({
        id: callId,
        chatId: chat.id,
        chatName: chat.name || '',
        isGroup,
        callerId: userProfile.userId,
        callerName: userProfile.displayName,
        callerAvatarColor: userProfile.avatarColor,
        callerPhotoURL: userProfile.photoURL,
        receiverId: otherId,
        receiverName: otherDetails?.displayName || chat.name || 'Amigo',
        receiverAvatarColor: otherDetails?.avatarColor,
        receiverPhotoURL: otherDetails?.photoURL,
        participants: chat.participants,
        status: 'ringing',
        callerMuted: false,
        receiverMuted: false,
      });
    } catch (err) {
      console.error('Erro ao iniciar chamada:', err);
    }
  };

  // Handler to answer an incoming call
  const handleAnswerCall = async () => {
    if (!incomingCall) return;
    const callToAnswer = incomingCall;
    setIncomingCall(null);
    setActiveCall(callToAnswer);
    await answerCallSession(callToAnswer.id);
  };

  // Handler to decline an incoming call
  const handleDeclineCall = async () => {
    if (!incomingCall) return;
    const callToDecline = incomingCall;
    setIncomingCall(null);
    await declineCallSession(callToDecline.id);
  };

  // Loading indicator on boot
  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center text-white">
        <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center animate-bounce shadow-xl shadow-indigo-500/30 mb-4">
          <MessageSquare className="w-7 h-7 text-white" />
        </div>
        <p className="text-sm font-semibold tracking-wide text-zinc-300">
          Carregando Papo...
        </p>
      </div>
    );
  }

  // Not authenticated
  if (!currentUser || !userProfile) {
    return <LoginScreen />;
  }

  // Active chat object
  const activeChat = chats.find((c) => c.id === activeChatId) || null;

  return (
    <div className="relative flex h-screen w-screen overflow-hidden bg-zinc-950 font-sans text-zinc-100">
      {/* 
        Responsive layout:
        - On desktop (md+): both Sidebar and ChatArea visible
        - On mobile (<md): shows Sidebar if activeChatId is null, or ChatArea if activeChatId is set
      */}
      <Sidebar
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={(id) => setActiveChatId(id)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        className={`${activeChatId ? 'hidden md:flex' : 'flex'}`}
      />

      <main className={`flex-1 h-full overflow-hidden ${activeChatId ? 'flex' : 'hidden md:flex'}`}>
        {activeChat ? (
          <ChatArea
            chat={activeChat}
            onBack={() => setActiveChatId(null)}
            onStartCall={handleStartCall}
          />
        ) : (
          <EmptyChatState
            onOpenFriendsModal={() => setIsFriendsModalOpen(true)}
          />
        )}
      </main>

      {/* 
        Floating Action Button in the bottom-right corner:
        Opens the Friends screen / modal. Hides automatically when inside a chat conversation!
      */}
      {!activeChatId && (
        <button
          onClick={() => setIsFriendsModalOpen(true)}
          className="fixed bottom-5 right-5 z-40 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs sm:text-sm shadow-xl shadow-indigo-600/30 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-indigo-400/20"
          title="Amigos e Adicionar"
        >
          <Users className="w-4 h-4 sm:w-5 sm:h-5" />
          <span>Amigos</span>
        </button>
      )}

      {/* Incoming Call Notification Pop-up */}
      {incomingCall && (
        <IncomingCallAlert
          call={incomingCall}
          onAnswer={handleAnswerCall}
          onDecline={handleDeclineCall}
        />
      )}

      {/* Active Call Modal (Full or Minimized Floating Dock) */}
      {activeCall && (
        <CallModal
          call={activeCall}
          currentUserId={userProfile.userId}
          onClose={() => setActiveCall(null)}
        />
      )}

      {/* Friends & Add Friend Modal */}
      <FriendsModal
        isOpen={isFriendsModalOpen}
        onClose={() => setIsFriendsModalOpen(false)}
        chats={chats}
        onOpenChat={(chatId) => {
          setActiveChatId(chatId);
        }}
      />

      {/* Profile Settings Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </ThemeProvider>
  );
}
