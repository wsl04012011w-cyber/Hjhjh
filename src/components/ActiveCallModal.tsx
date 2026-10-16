import React, { useState, useEffect, useRef } from 'react';
import { CallSession } from '../types/chat';
import { Avatar } from './Avatar';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Wifi
} from 'lucide-react';

interface ActiveCallModalProps {
  call: CallSession | null;
  currentUserId: string;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
}

export const ActiveCallModal: React.FC<ActiveCallModalProps> = ({
  call,
  currentUserId,
  localStream,
  remoteStream,
  onEndCall,
}) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Set remote audio stream when available
  useEffect(() => {
    if (remoteAudioRef.current && remoteStream) {
      remoteAudioRef.current.srcObject = remoteStream;
      remoteAudioRef.current.play().catch((e) => {
        console.warn('Auto-play blocked or waiting user gesture:', e);
      });
    }
  }, [remoteStream]);

  // Duration timer when connected
  useEffect(() => {
    let interval: any = null;
    if (call?.status === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setCallDuration(0);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [call?.status]);

  if (!call || call.status === 'ended' || call.status === 'declined') {
    return null;
  }

  const isCaller = call.callerId === currentUserId;
  const otherName = isCaller ? call.receiverName : call.callerName;
  const otherAvatarColor = isCaller ? call.receiverAvatarColor : call.callerAvatarColor;
  const otherPhotoURL = isCaller ? call.receiverPhotoURL : call.callerPhotoURL;

  // Toggle Microphone Mute
  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Toggle Remote Speaker Mute
  const toggleSpeakerMute = () => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = !remoteAudioRef.current.muted;
      setIsSpeakerMuted(remoteAudioRef.current.muted);
    }
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xl animate-in fade-in duration-200">
      {/* Hidden audio element for remote stream playback */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl flex flex-col items-center text-center space-y-6 relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Status header */}
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1 rounded-full bg-zinc-800 border border-zinc-700/80 text-zinc-300">
          <Wifi className={`w-3.5 h-3.5 ${call.status === 'connected' ? 'text-emerald-400' : 'text-amber-400 animate-pulse'}`} />
          <span>
            {call.status === 'connected'
              ? `Conectado • ${formatSeconds(callDuration)}`
              : 'Chamando...'}
          </span>
        </div>

        {/* Other Person Avatar with audio ripples */}
        <div className="relative my-2">
          {call.status === 'connected' && (
            <div className="absolute -inset-3 bg-indigo-500/20 rounded-full animate-ping pointer-events-none" />
          )}
          <Avatar
            name={otherName}
            avatarColor={otherAvatarColor}
            photoURL={otherPhotoURL}
            size="xl"
            className="w-24 h-24 text-3xl border-4 border-indigo-500/40 shadow-2xl relative z-10"
          />
        </div>

        {/* Participant Name */}
        <div>
          <h3 className="text-xl font-bold text-white truncate max-w-xs">
            {otherName}
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            {call.status === 'connected' ? 'Chamada de voz ativa' : 'Aguardando atendimento...'}
          </p>
        </div>

        {/* Controls Toolbar: Mute, Speaker, Hangup */}
        <div className="flex items-center justify-center gap-5 pt-4 w-full border-t border-zinc-800/80">
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
            title={isMuted ? 'Desmutar microfone' : 'Mutar microfone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          {/* End Call / Desligar */}
          <button
            onClick={onEndCall}
            className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            title="Desligar chamada"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {/* Mute Speaker */}
          <button
            onClick={toggleSpeakerMute}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md ${
              isSpeakerMuted
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
            }`}
            title={isSpeakerMuted ? 'Ativar alto-falante' : 'Mutar som'}
          >
            {isSpeakerMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </div>
  );
};
