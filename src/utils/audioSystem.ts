/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Web Audio API Procedural Heritage Sound Effects
class HeritageAudioSynthesizer {
  private ctx: AudioContext | null = null;

  private init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Ancient Temple Bell (Tiếng chuông đồng trầm ấm ngân vang)
  playTempleBell() {
    try {
      const ctx = this.init();
      const now = ctx.currentTime;

      // Base fundamental + rich harmonics
      const freqs = [180, 360, 540, 720, 920];
      const gains = [0.4, 0.25, 0.15, 0.08, 0.05];

      freqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = idx === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, now);

        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(gains[idx], now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.2 - idx * 0.4);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 3.2);
      });
    } catch {
      // AudioContext may be blocked before interaction
    }
  }

  // Correct answer chime (Âm thanh trả lời đúng)
  playCorrect() {
    try {
      const ctx = this.init();
      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.2, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } catch {}
  }

  // Click / Hotspot touch sound
  playClick() {
    try {
      const ctx = this.init();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(400, now + 0.05);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {}
  }

  // Achievement unlock fanfare (Âm thanh mở khóa danh hiệu)
  playFanfare() {
    try {
      const ctx = this.init();
      const now = ctx.currentTime;
      const chords = [
        { freqs: [440, 554.37, 659.25], time: 0, dur: 0.2 },
        { freqs: [493.88, 622.25, 739.99], time: 0.22, dur: 0.2 },
        { freqs: [587.33, 739.99, 880], time: 0.45, dur: 0.6 },
      ];

      chords.forEach((chord) => {
        chord.freqs.forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, now + chord.time);

          gain.gain.setValueAtTime(0, now + chord.time);
          gain.gain.linearRampToValueAtTime(0.15, now + chord.time + 0.03);
          gain.gain.exponentialRampToValueAtTime(0.001, now + chord.time + chord.dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + chord.time);
          osc.stop(now + chord.time + chord.dur);
        });
      });
    } catch {}
  }
}

export const heritageAudio = new HeritageAudioSynthesizer();

// Vietnamese Speech Synthesis Narrator (Hệ thống đọc thuyết minh tiếng Việt tự nhiên)
export class VietnameseNarrator {
  private utterance: SpeechSynthesisUtterance | null = null;
  private isSpeaking = false;
  private isPaused = false;
  private onEndCallback?: () => void;
  private onBoundaryCallback?: (charIndex: number) => void;

  speak(
    text: string,
    options?: {
      rate?: number;
      pitch?: number;
      onEnd?: () => void;
      onBoundary?: (charIndex: number) => void;
    }
  ) {
    if (!('speechSynthesis' in window)) {
      return false;
    }

    this.stop();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = options?.rate ?? 0.95;
    utterance.pitch = options?.pitch ?? 1.0;

    // Try finding Vietnamese voice
    const voices = window.speechSynthesis.getVoices();
    const viVoice = voices.find((v) => v.lang.startsWith('vi') || v.lang.includes('VIE'));
    if (viVoice) {
      utterance.voice = viVoice;
    }

    this.onEndCallback = options?.onEnd;
    this.onBoundaryCallback = options?.onBoundary;

    utterance.onend = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.onEndCallback?.();
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.isPaused = false;
      this.onEndCallback?.();
    };

    if (options?.onBoundary) {
      utterance.onboundary = (e) => {
        this.onBoundaryCallback?.(e.charIndex);
      };
    }

    this.utterance = utterance;
    this.isSpeaking = true;
    this.isPaused = false;
    window.speechSynthesis.speak(utterance);
    return true;
  }

  pause() {
    if ('speechSynthesis' in window && this.isSpeaking) {
      window.speechSynthesis.pause();
      this.isPaused = true;
    }
  }

  resume() {
    if ('speechSynthesis' in window && this.isPaused) {
      window.speechSynthesis.resume();
      this.isPaused = false;
    }
  }

  stop() {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isSpeaking = false;
      this.isPaused = false;
    }
  }

  getStatus() {
    return {
      isSpeaking: this.isSpeaking,
      isPaused: this.isPaused,
    };
  }
}

export const narrator = new VietnameseNarrator();
