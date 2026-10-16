import React from 'react';
import { CallSession } from '../types/chat';
import { Avatar } from './Avatar';
import { Phone, PhoneOff, PhoneIncoming } from 'lucide-react';

interface IncomingCallModalProps {
  call: CallSession | null;
  onAnswer: (call: CallSession) => void;
  onDecline: (call: CallSession) => void;
}

export const IncomingCallModal: React.FC<IncomingCallModalProps> = ({
  call,
  onAnswer,
  onDecline,
}) => {
  if (!call || call.status !== 'ringing') return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-2xl flex flex-col items-center text-center space-y-6">
        {/* Pulsing Avatar */}
        <div className="relative">
          <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
          <Avatar
            name={call.callerName}
            avatarColor={call.callerAvatarColor}
            photoURL={call.callerPhotoURL}
            size="xl"
            className="relative z-10 border-4 border-emerald-500/30 shadow-xl"
          />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold mb-2 border border-emerald-500/20">
            <PhoneIncoming className="w-3.5 h-3.5 animate-bounce" />
            <span>Chamada de Voz</span>
          </div>
          <h3 className="text-xl font-bold text-white truncate max-w-xs">
            {call.callerName}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            está ligando para você...
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center justify-center gap-8 w-full pt-2">
          {/* Decline */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => onDecline(call)}
              className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 active:scale-95 transition-all cursor-pointer"
              title="Recusar chamada"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
            <span className="text-[11px] font-semibold text-rose-300">Recusar</span>
          </div>

          {/* Answer */}
          <div className="flex flex-col items-center gap-1.5">
            <button
              onClick={() => onAnswer(call)}
              className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 active:scale-95 transition-all animate-pulse cursor-pointer"
              title="Atender chamada"
            >
              <Phone className="w-6 h-6" />
            </button>
            <span className="text-[11px] font-semibold text-emerald-300">Atender</span>
          </div>
        </div>
      </div>
    </div>
  );
};
