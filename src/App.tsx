import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LoginScreen } from './components/LoginScreen';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { EmptyChatState } from './components/EmptyChatState';
import { FriendsModal } from './components/FriendsModal';
import { ProfileModal } from './components/ProfileModal';
import { Chat } from './types/chat';
import { subscribeToUserChats } from './services/chatService';
import { MessageSquare, Users } from 'lucide-react';

const MainApp: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isFriendsModalOpen, setIsFriendsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
