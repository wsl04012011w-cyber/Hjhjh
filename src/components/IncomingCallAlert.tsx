import React, { useEffect } from 'react';
import { CallSession } from '../types/chat';
import { Avatar } from './Avatar';
import { callSoundService } from '../services/callSoundService';
import { Phone, PhoneOff } from 'lucide-react';

interface IncomingCallAlertProps {
  call: CallSession;
  onAnswer: () => void;
  onDecline: () => void;
}

export const IncomingCallAlert: React.FC<IncomingCallAlertProps> = ({
  call,
  onAnswer,
  onDecline,
}) => {
  // Start incoming ringtone and native browser notification on mount
  useEffect(() => {
    callSoundService.playIncomingRing();

    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Papo - Chamada Recebida', {
          body: `Recebendo ligação de ${call.callerName}`,
          icon: '/icon-512.png',
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('Papo - Chamada Recebida', {
              body: `Recebendo ligação de ${call.callerName}`,
              icon: '/icon-512.png',
            });
          }
        });
      }
    }

    return () => {
      callSoundService.stopAllSounds();
    };
  }, [call.callerName]);

  return (
    <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-in slide-in-from-top-4 duration-300">
      <div className="p-4 rounded-3xl bg-zinc-900/95 border border-indigo-500/30 shadow-2xl shadow-indigo-950/80 backdrop-blur-xl flex items-center justify-between gap-4">
        {/* Caller Avatar with animated pulsing aura */}
        <div className="relative flex-shrink-0">
          <span className="absolute -inset-1 rounded-full bg-emerald-500/30 animate-ping" />
          <Avatar
            name={call.callerName}
            avatarColor={call.callerAvatarColor}
            photoURL={call.callerPhotoURL}
            size="lg"
            className="relative"
          />
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-emerald-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            Chamada de voz recebida
          </p>
          <h4 className="font-bold text-sm sm:text-base text-white truncate">
            {call.callerName}
          </h4>
          <p className="text-xs text-zinc-400 truncate">
            {call.isGroup ? `No grupo ${call.chatName}` : 'Deseja iniciar uma conversa de voz'}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onDecline}
            className="w-11 h-11 rounded-2xl bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-rose-500/30 shadow-sm"
            title="Recusar chamada"
          >
            <PhoneOff className="w-5 h-5" />
          </button>

          <button
            onClick={onAnswer}
            className="w-11 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-lg shadow-emerald-600/30 border border-emerald-400/30 animate-bounce"
            title="Atender chamada"
          >
            <Phone className="w-5 h-5 fill-current" />
          </button>
        </div>
      </div>
    </div>
  );
};
