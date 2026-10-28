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

  // =========================================================================
  // UC-17: Âm thanh Phản hồi Đổi trạng thái bàn 1 chạm trên Tablet
  // SEATED -> CALL_BILL -> CLEANING -> AVAILABLE
  // =========================================================================

  /**
   * 1. Âm thanh YÊU CẦU TÍNH TIỀN (Call Bill Chime)
   * Chuông 2 nốt ngân chuông thanh nhã: E5 (659.25Hz) -> B5 (987.77Hz)
   * Báo hiệu Thu ngân chuẩn bị bill và máy POS
   */
  public playCallBill(): void {
    if (this.isMuted) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Note 1: E5 (659.25 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.18);

      // Note 2: B5 (987.77 Hz) - Ngân vang chuông nhà hàng
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(987.77, now + 0.1);
      gain2.gain.setValueAtTime(0.28, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.45);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([80, 50, 120]);
      }
    } catch (err) {
      console.warn('AudioContext playCallBill error:', err);
    }
  }

  /**
   * 2. Âm thanh BÁO DỌN BÀN (Cleaning Task Tone)
   * Chuỗi âm thanh quét dọn: G4 (392Hz) -> C5 (523.25Hz)
   * Báo hiệu Phục vụ và Tạp vụ vào dọn đĩa, thay khăn bàn
   */
  public playCleaning(): void {
    if (this.isMuted) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(392.0, now);
      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.14);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.08);
      gain2.gain.setValueAtTime(0.24, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.28);

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([70, 40, 70]);
      }
    } catch (err) {
      console.warn('AudioContext playCleaning error:', err);
    }
  }

  /**
   * 3. Âm thanh BÀN SẴN SÀNG (Table Available Fanfare)
   * Hợp âm trưởng 4 nốt rực rỡ: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
   * Báo hiệu Lễ tân bàn đã sạch tinh tươm, sẵn sàng đón lượt khách mới
   */
  public playTableAvailable(): void {
    if (this.isMuted) return;

    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const notes = [
        { freq: 523.25, start: 0, dur: 0.1 },
        { freq: 659.25, start: 0.07, dur: 0.1 },
        { freq: 783.99, start: 0.14, dur: 0.12 },
        { freq: 1046.50, start: 0.21, dur: 0.35 }
      ];

      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + start);
        gain.gain.setValueAtTime(0.24, now + start);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur);
      });

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([50, 30, 50, 30, 90]);
      }
    } catch (err) {
      console.warn('AudioContext playTableAvailable error:', err);
    }
  }

  /**
   * Tự động phát âm thanh theo trạng thái chuyển đổi 1 chạm
   */
  public playOneTouchTransition(targetStatus: string): void {
    switch (targetStatus) {
      case 'CALL_BILL':
        this.playCallBill();
        break;
      case 'CLEANING':
        this.playCleaning();
        break;
      case 'AVAILABLE':
        this.playTableAvailable();
        break;
      case 'SEATED':
      default:
        this.playSuccess();
        break;
    }
  }
}

export const hostAudioService = new HostAudioFeedbackService();
