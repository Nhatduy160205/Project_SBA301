/**
 * UC-16: Audio Feedback Service for Host Camera QR Scanner
 * Sử dụng Web Audio API (AudioContext) để phát âm thanh báo kết quả quét mã vé:
 * - Âm thanh thành công (Success Chime): 3 nốt nhạc cao thanh thoát chuẩn Haute Gastronomy.
 * - Âm thanh cảnh báo lỗi (Error Buzz): Âm trầm cảnh báo vé giả mạo hoặc vé đã quét trước đó.
 * Hoạt động 100% native trong trình duyệt không phụ thuộc vào file MP3 ngoại vi.
 */

class HostAudioFeedbackService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Khởi tạo audio context khi người dùng tương tác đầu tiên
    if (typeof window !== 'undefined') {
      const storedMute = localStorage.getItem('tablemaster_host_audio_muted');
      if (storedMute !== null) {
        this.isMuted = storedMute === 'true';
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;

    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }

    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }

    return this.audioCtx;
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (typeof window !== 'undefined') {
      localStorage.setItem('tablemaster_host_audio_muted', String(muted));
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Phát âm thanh BÍP THÀNH CÔNG (Success Chime) trong <1s:
   * 3 nốt D5 (587.33 Hz) -> A5 (880.00 Hz) -> D6 (1174.66 Hz)
   * Kèm rung phản hồi Haptic trên Tablet/Điện thoại
   */
  public playSuccess(): void {
    if (this.isMuted) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Nốt 1: D5 (587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.12);

      // Nốt 2: A5 (880.00 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880.0, now + 0.08);
      gain2.gain.setValueAtTime(0.25, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.22);

      // Nốt 3: D6 (1174.66 Hz) - Âm vang sang trọng
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(1174.66, now + 0.16);
      gain3.gain.setValueAtTime(0.28, now + 0.16);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.16);
      osc3.stop(now + 0.45);

      // Rung thiết bị (Haptic feedback)
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([60, 40, 80]);
      }
    } catch (err) {
      console.warn('AudioContext playSuccess error:', err);
    }
  }

  /**
   * Phát âm thanh CẢNH BÁO LỖI / GIAN LẬN (Anti-Fraud Buzz):
   * Âm Sawtooth dồn dập 220Hz -> 180Hz -> 140Hz
   * Kèm rung cảnh báo mạnh trên Tablet
   */
  public playError(): void {
    if (this.isMuted) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Pulse 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(220, now);
      osc1.frequency.linearRampToValueAtTime(180, now + 0.15);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Pulse 2
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(180, now + 0.18);
      osc2.frequency.linearRampToValueAtTime(140, now + 0.35);
      gain2.gain.setValueAtTime(0.35, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.38);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.38);

      // Rung cảnh báo gian lận
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    } catch (err) {
      console.warn('AudioContext playError error:', err);
    }
  }
}

export const hostAudioService = new HostAudioFeedbackService();
