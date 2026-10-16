import React, { useState, useEffect, useRef } from 'react';
import { CallSession } from '../types/chat';
import { Avatar } from './Avatar';
import { setCallMute, endCallSession } from '../services/callService';
import { callSoundService } from '../services/callSoundService';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Minimize2, 
  Maximize2, 
  Radio
} from 'lucide-react';

interface CallModalProps {
  call: CallSession;
  currentUserId: string;
  onClose: () => void;
}

export const CallModal: React.FC<CallModalProps> = ({
  call,
  currentUserId,
  onClose,
}) => {
  const isCaller = call.callerId === currentUserId;
  const isConnected = call.status === 'connected';
  const isRinging = call.status === 'ringing';

  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);

  const localStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<any>(null);

  // Determine other participant's details
  const remoteName = isCaller ? call.receiverName : call.callerName;
  const remoteAvatarColor = isCaller ? call.receiverAvatarColor : call.callerAvatarColor;
  const remotePhotoURL = isCaller ? call.receiverPhotoURL : call.callerPhotoURL;
  const remoteIsMuted = isCaller ? call.receiverMuted : call.callerMuted;

  // Handle outgoing ringing tone
  useEffect(() => {
    if (isCaller && isRinging) {
      callSoundService.playOutgoingRing();
    }
    return () => {
      callSoundService.stopAllSounds();
    };
  }, [isCaller, isRinging]);

  // Handle connection chime & timer
  useEffect(() => {
    if (isConnected) {
      callSoundService.playConnectedChime();

      timerRef.current = setInterval(() => {
        setDurationSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isConnected]);

  // Handle call termination from either party
  useEffect(() => {
    if (call.status === 'ended' || call.status === 'declined') {
      callSoundService.playEndChime();
      cleanupMedia();
      const timeout = setTimeout(() => {
        onClose();
      }, 1200);
      return () => clearTimeout(timeout);
    }
  }, [call.status, onClose]);

  // Request local microphone stream on mount
  useEffect(() => {
    let mounted = true;

    async function initAudio() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          if (!mounted) {
            stream.getTracks().forEach((t) => t.stop());
            return;
          }
          localStreamRef.current = stream;
        }
      } catch (err) {
        console.warn('Microphone access denied or unavailable in this environment:', err);
      }
    }

    initAudio();

    return () => {
      mounted = false;
      cleanupMedia();
    };
  }, []);

  const cleanupMedia = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }
  };

  // Toggle Mute
  const handleToggleMute = async () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);

    // Mute/unmute actual local track
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        track.enabled = !nextMuted;
      });
    }

    // Sync to Firestore so peer sees remote mute state
    await setCallMute(call.id, isCaller, nextMuted);
  };

  // Toggle Deafen / Speaker
  const handleToggleDeafen = () => {
    setIsDeafened(!isDeafened);
  };

  // End Call
  const handleEndCall = async () => {
    callSoundService.playEndChime();
    cleanupMedia();
    await endCallSession(call.id);
    onClose();
  };

  // Format seconds to mm:ss
  const formatDuration = (secs: number) => {
    const m = Math.floor(secs / 60)
      .toString()
      .padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // MINIMIZED FLOATING BAR (Allows user to chat while on the call!)
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-sm animate-in slide-in-from-bottom-3 duration-200">
        <div className="p-2.5 px-4 rounded-2xl bg-zinc-900/95 border border-indigo-500/40 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-white">
          <div
            onClick={() => setIsMinimized(false)}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
          >
            <div className="relative">
              <Avatar
                name={remoteName}
                avatarColor={remoteAvatarColor}
                photoURL={remotePhotoURL}
                size="sm"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-zinc-900 animate-pulse" />
            </div>

            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate max-w-[120px]">
                {remoteName}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono">
                {isConnected ? formatDuration(durationSeconds) : 'Chamando...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Quick Mute button */}
            <button
              onClick={handleToggleMute}
              className={`p-2 rounded-xl transition-colors cursor-pointer ${
                isMuted
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  : 'bg-zinc-800 text-zinc-300 hover:text-white'
              }`}
              title={isMuted ? 'Desmutar microfone' : 'Mutar microfone'}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* End Call */}
            <button
              onClick={handleEndCall}
              className="p-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer shadow-md shadow-rose-600/30"
              title="Desligar chamada"
            >
              <PhoneOff className="w-4 h-4" />
            </button>

            {/* Expand */}
            <button
              onClick={() => setIsMinimized(false)}
              className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              title="Expandir tela da chamada"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // FULL SCREEN / MODAL OVERLAY
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-sm rounded-3xl bg-zinc-900/95 border border-white/10 shadow-2xl p-6 flex flex-col items-center text-center overflow-hidden">
        {/* Top Header Buttons */}
        <div className="w-full flex items-center justify-between mb-6">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] text-zinc-300">
            <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>Chamada de Voz</span>
          </div>

          <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Minimizar chamada para continuar conversando"
          >
            <Minimize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Remote User Avatar with dynamic wave aura */}
        <div className="relative my-4 flex items-center justify-center">
          {isConnected && !remoteIsMuted && (
            <>
              <div className="absolute w-36 h-36 rounded-full bg-indigo-500/10 animate-ping duration-1000" />
              <div className="absolute w-28 h-28 rounded-full bg-indigo-500/20 animate-pulse" />
            </>
          )}

          {isRinging && (
            <div className="absolute w-32 h-32 rounded-full bg-emerald-500/20 animate-ping duration-700" />
          )}

          <div className="relative z-10 shadow-2xl rounded-full">
            <Avatar
              name={remoteName}
              avatarColor={remoteAvatarColor}
              photoURL={remotePhotoURL}
              size="xl"
              className="w-24 h-24 ring-4 ring-indigo-500/30"
            />
          </div>
        </div>

        {/* User / Group Title */}
        <h3 className="text-xl font-bold text-white mt-2 truncate max-w-xs">
          {remoteName}
        </h3>

        {/* Call Status & Timer */}
        <div className="mt-1 mb-6">
          {call.status === 'ringing' ? (
            <p className="text-sm font-medium text-emerald-400 flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>{isCaller ? 'Chamando amigo...' : 'Conectando chamada...'}</span>
            </p>
          ) : call.status === 'connected' ? (
            <div className="flex flex-col items-center gap-1">
              <span className="text-base font-mono font-semibold text-emerald-400">
                {formatDuration(durationSeconds)}
              </span>
              {remoteIsMuted && (
                <span className="text-xs text-rose-400 flex items-center gap-1 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 mt-1">
                  <MicOff className="w-3 h-3" />
                  <span>Amigo mutou o microfone</span>
                </span>
              )}
            </div>
          ) : (
            <p className="text-sm text-zinc-400">Chamada encerrada</p>
          )}
        </div>

        {/* Simulated Voice Frequency Waveform while speaking */}
        {isConnected && (
          <div className="flex items-center justify-center gap-1 h-6 mb-8 w-32">
            {[40, 75, 55, 95, 60, 85, 45, 90, 70, 50].map((h, i) => (
              <span
                key={i}
                className="w-1 bg-indigo-400/80 rounded-full transition-all duration-150"
                style={{
                  height: isMuted ? '4px' : `${h}%`,
                  animation: !isMuted ? `pulse 1.2s infinite ease-in-out ${i * 0.1}s` : 'none',
                }}
              />
            ))}
          </div>
        )}

        {/* Controls Toolbar */}
        <div className="w-full flex items-center justify-center gap-4 pt-2 border-t border-white/5">
          {/* Mute button */}
          <button
            onClick={handleToggleMute}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
              isMuted
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 shadow-lg shadow-rose-950/40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5'
            }`}
            title={isMuted ? 'Desmutar microfone' : 'Mutar microfone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            <span className="text-[10px] font-medium">{isMuted ? 'Mutado' : 'Mutar'}</span>
          </button>

          {/* End Call button */}
          <button
            onClick={handleEndCall}
            className="w-16 h-16 rounded-full bg-rose-600 hover:bg-rose-500 text-white flex items-center justify-center shadow-xl shadow-rose-600/40 transition-all hover:scale-105 active:scale-95 cursor-pointer border border-rose-400/30"
            title="Desligar chamada"
          >
            <PhoneOff className="w-7 h-7" />
          </button>

          {/* Speaker / Deafen button */}
          <button
            onClick={handleToggleDeafen}
            className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer ${
              isDeafened
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-lg shadow-amber-950/40'
                : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/5'
            }`}
            title={isDeafened ? 'Ativar som' : 'Silenciar som'}
          >
            {isDeafened ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            <span className="text-[10px] font-medium">{isDeafened ? 'Mudo' : 'Som'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
