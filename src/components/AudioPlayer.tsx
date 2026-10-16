import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface AudioPlayerProps {
  audioSrc: string;
  duration?: number;
  isCurrentUser: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioSrc,
  duration = 0,
  isCurrentUser,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.error('Erro ao reproduzir áudio:', e);
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const displayTime = isPlaying
    ? formatSeconds(currentTime)
    : formatSeconds(totalDuration || duration);

  return (
    <div className="flex items-center gap-2.5 py-1 min-w-[200px] sm:min-w-[240px] max-w-full">
      <audio ref={audioRef} src={audioSrc} preload="metadata" />

      {/* Play/Pause circular button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform active:scale-95 cursor-pointer flex-shrink-0 shadow-sm ${
          isCurrentUser
            ? 'bg-white text-indigo-600 hover:bg-zinc-100'
            : 'bg-indigo-600 text-white hover:bg-indigo-500'
        }`}
        title={isPlaying ? 'Pausar áudio' : 'Reproduzir áudio'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Progress track & timer */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <input
          type="range"
          min={0}
          max={totalDuration || duration || 1}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-current ${
            isCurrentUser
              ? 'bg-indigo-400/40 text-white'
              : 'bg-zinc-700 text-indigo-400'
          }`}
        />

        <div className="flex items-center justify-between mt-1 text-[10px]">
          <span className={isCurrentUser ? 'text-indigo-200' : 'text-zinc-400'}>
            {displayTime}
          </span>
          <Volume2 className={`w-3 h-3 ${isCurrentUser ? 'text-indigo-200' : 'text-zinc-500'}`} />
        </div>
      </div>
    </div>
  );
};
