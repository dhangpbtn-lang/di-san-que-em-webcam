/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { narrator, heritageAudio } from '../../utils/audioSystem';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  FileText,
  Upload,
  Gauge
} from 'lucide-react';

interface AudioPlayerBarProps {
  title: string;
  transcript: string;
  fileUrl?: string;
  durationText?: string;
  onAudioUploaded?: (url: string) => void;
  onFinished?: () => void;
}

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  title,
  transcript,
  fileUrl,
  durationText = '2:15',
  onAudioUploaded,
  onFinished,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [showTranscript, setShowTranscript] = useState(false);
  const [currentTime, setCurrentTime] = useState('0:00');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressIntervalRef = useRef<number | null>(null);

  // Initialize or update audio element when fileUrl changes
  useEffect(() => {
    if (fileUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(fileUrl);
      } else {
        audioRef.current.src = fileUrl;
      }

      audioRef.current.volume = isMuted ? 0 : volume;
      audioRef.current.playbackRate = speed;

      audioRef.current.ontimeupdate = () => {
        if (!audioRef.current) return;
        const cur = audioRef.current.currentTime;
        const dur = audioRef.current.duration || 1;
        setProgress((cur / dur) * 100);

        const mins = Math.floor(cur / 60);
        const secs = Math.floor(cur % 60);
        setCurrentTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
      };

      audioRef.current.onended = () => {
        setIsPlaying(false);
        setProgress(0);
        onFinished?.();
      };
    } else {
      // Use speech synthesizer if no MP3 file
      audioRef.current?.pause();
      audioRef.current = null;
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      narrator.stop();
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [fileUrl, onFinished]);

  // Handle Play / Pause
  const togglePlay = () => {
    heritageAudio.playClick();
    if (isPlaying) {
      if (fileUrl && audioRef.current) {
        audioRef.current.pause();
      } else {
        narrator.pause();
      }
      setIsPlaying(false);
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    } else {
      if (fileUrl && audioRef.current) {
        audioRef.current.play().catch(() => {});
      } else {
        narrator.speak(transcript, {
          rate: speed,
          onEnd: () => {
            setIsPlaying(false);
            setProgress(100);
            onFinished?.();
            if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
          },
        });
        // Simulated progress for speech synthesis
        let simulatedSec = 0;
        const estDuration = Math.max(30, transcript.length / 15);
        progressIntervalRef.current = window.setInterval(() => {
          simulatedSec += 0.5;
          const p = Math.min(100, (simulatedSec / estDuration) * 100);
          setProgress(p);
          const mins = Math.floor(simulatedSec / 60);
          const secs = Math.floor(simulatedSec % 60);
          setCurrentTime(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
        }, 500);
      }
      setIsPlaying(true);
    }
  };

  // Replay
  const handleReplay = () => {
    heritageAudio.playClick();
    if (fileUrl && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      setIsPlaying(true);
    } else {
      narrator.stop();
      setProgress(0);
      setCurrentTime('0:00');
      narrator.speak(transcript, {
        rate: speed,
        onEnd: () => {
          setIsPlaying(false);
          onFinished?.();
        },
      });
      setIsPlaying(true);
    }
  };

  // Volume change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (audioRef.current) audioRef.current.volume = volume || 0.5;
    } else {
      setIsMuted(true);
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  // Speed change (0.75x -> 1x -> 1.25x)
  const cycleSpeed = () => {
    const speeds = [0.75, 1, 1.25];
    const nextIdx = (speeds.indexOf(speed) + 1) % speeds.length;
    const nextSpeed = speeds[nextIdx];
    setSpeed(nextSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextSpeed;
    }
  };

  // File upload for teachers
  const handleAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      onAudioUploaded?.(url);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-[#2a130b] via-[#381a0f] to-[#200d07] border-2 border-amber-600/50 rounded-2xl p-4 shadow-xl text-amber-100 flex flex-col gap-3">
      {/* Title & Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-600 to-amber-400 hover:from-amber-500 hover:to-amber-300 text-stone-950 font-bold flex items-center justify-center shadow-lg transform active:scale-95 transition-all"
            title={isPlaying ? 'Tạm dừng thuyết minh' : 'Phát thuyết minh'}
          >
            {isPlaying ? <Pause className="w-6 h-6 fill-stone-950" /> : <Play className="w-6 h-6 ml-0.5 fill-stone-950" />}
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                {fileUrl ? 'File MP3 đính kèm' : 'Thuyết minh thông minh'}
              </span>
              <span className="text-xs text-amber-400/80 font-mono">
                {currentTime} / {durationText}
              </span>
            </div>
            <h4 className="text-sm md:text-base font-serif font-bold text-amber-100 line-clamp-1">
              {title}
            </h4>
          </div>
        </div>

        {/* Action Buttons: Replay, Speed, Volume, Transcript, Upload */}
        <div className="flex items-center gap-2">
          {/* Replay */}
          <button
            type="button"
            onClick={handleReplay}
            className="p-2 bg-stone-900/60 hover:bg-stone-800 text-amber-300 rounded-lg border border-amber-700/40 transition-colors"
            title="Nghe lại từ đầu"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Speed Toggle */}
          <button
            type="button"
            onClick={cycleSpeed}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-900/60 hover:bg-stone-800 text-amber-300 text-xs font-mono font-bold rounded-lg border border-amber-700/40 transition-colors"
            title="Tốc độ phát (0.75x, 1x, 1.25x)"
          >
            <Gauge className="w-3.5 h-3.5" />
            <span>{speed}x</span>
          </button>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-1.5 bg-stone-900/60 px-2 py-1.5 rounded-lg border border-amber-700/40">
            <button
              type="button"
              onClick={toggleMute}
              className="text-amber-300 hover:text-amber-100"
              title={isMuted ? 'Bật âm lượng' : 'Tắt tiếng'}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 h-1.5 accent-amber-500 bg-stone-700 rounded-lg cursor-pointer"
            />
          </div>

          {/* Show Transcript Toggle */}
          <button
            type="button"
            onClick={() => setShowTranscript(!showTranscript)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              showTranscript
                ? 'bg-amber-600 text-stone-950 font-bold border-amber-400'
                : 'bg-stone-900/60 hover:bg-stone-800 text-amber-200 border-amber-700/40'
            }`}
            title="Xem lời thuyết minh chi tiết"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Lời đọc</span>
          </button>

          {/* Attach MP3 for teacher */}
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/mp3,audio/*"
            className="hidden"
            onChange={handleAudioFile}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 bg-stone-900/60 hover:bg-stone-800 text-amber-300 rounded-lg border border-amber-700/40 transition-colors"
            title="Tải lên file MP3 thuyết minh thực tế"
          >
            <Upload className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress timeline bar */}
      <div className="relative w-full h-2 bg-stone-950/80 rounded-full overflow-hidden border border-amber-900/60">
        <div
          className="h-full bg-gradient-to-r from-red-600 via-amber-500 to-amber-300 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Expandable Transcript Panel */}
      {showTranscript && (
        <div className="p-4 bg-stone-950/70 border border-amber-800/50 rounded-xl space-y-2 text-sm text-amber-100/90 leading-relaxed font-serif animate-in fade-in duration-200">
          <p className="font-sans text-xs uppercase tracking-wider text-amber-400 font-semibold">
            Văn bản thuyết minh chính thức:
          </p>
          <p className="italic">« {transcript} »</p>
        </div>
      )}
    </div>
  );
};
