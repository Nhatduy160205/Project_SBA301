/**
 * WebSocket STOMP Service (UC-06: Real-time Floor Plan & Concurrency Hold Sync)
 * Kết nối tới Spring Boot STOMP Broker (/ws) để nhận sự kiện cập nhật trạng thái bàn:
 * - Đổi màu bàn sang VÀNG nhấp nháy (HOLDING) khi có khách bấm giữ chỗ 5 phút (BR-02).
 * - Đổi màu bàn về XANH LÁ (AVAILABLE) khi hết hạn 300s hoặc khách hủy chọn.
 * - Đổi màu bàn sang ĐỎ (CONFIRMED) khi cọc tiền thành công.
 */

import type { TableStateUpdatePayload } from './bookingApi';

type TableUpdateListener = (update: TableStateUpdatePayload) => void;

class WebSocketFloorService {
  private socket: WebSocket | null = null;
  private listeners: Set<TableUpdateListener> = new Set();
  private isConnecting: boolean = false;
  private reconnectTimer: any = null;
  private heartbeatTimer: any = null;
  private subCounter: number = 0;

  constructor() {
    this.connect();
  }

  public connect(): void {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isConnecting = true;

    // Xác định URL WebSocket: ưu tiên Gateway (8080) hoặc Booking Service (8083)
    const host = window.location.hostname || 'localhost';
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    // Nếu chạy qua vite dev proxy hoặc gateway
    const wsUrl = `${wsProtocol}//${host}:8083/ws/websocket`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        console.log('🟢 [WebSocket] Đã kết nối thành công tới TableMaster WebSocket STOMP Broker');

        // Gửi khung tin STOMP CONNECT
        const connectFrame = 'CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n\n\0';
        this.socket?.send(connectFrame);
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        this.cleanup();
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.debug('ℹ️ [WebSocket] Đang chuyển đổi kênh đồng bộ thời gian thực:', err);
      };
    } catch (err: any) {
      this.isConnecting = false;
      this.scheduleReconnect();
    }
  }

  private handleMessage(data: string): void {
    if (!data) return;

    // Xử lý khung tin STOMP CONNECTED
    if (data.startsWith('CONNECTED')) {
      console.log('✅ [STOMP] Máy chủ xác nhận phiên STOMP CONNECTED. Đang đăng ký topic...');
      this.subscribe('/topic/tables/status');
      this.subscribe('/topic/floor-plan');
      this.startHeartbeat();
      return;
    }

    // Xử lý khung tin STOMP MESSAGE
    if (data.startsWith('MESSAGE')) {
      try {
        const bodyStart = data.indexOf('\n\n');
        if (bodyStart !== -1) {
          const bodyStr = data.substring(bodyStart + 2).replace(/\0$/, '').trim();
          if (bodyStr) {
            const parsed = JSON.parse(bodyStr) as TableStateUpdatePayload;
            this.notifyListeners(parsed);
          }
        }
      } catch (err: any) {
        console.warn('Lỗi phân giải STOMP payload:', err.message);
      }
    }
  }

  private subscribe(destination: string): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return;
    const subId = `sub-${++this.subCounter}`;
    const subFrame = `SUBSCRIBE\nid:${subId}\ndestination:${destination}\nack:auto\n\n\0`;
    this.socket.send(subFrame);
    console.log(`📡 [STOMP] Đã đăng ký lắng nghe topic: ${destination}`);
  }

  private startHeartbeat(): void {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send('\n'); // STOMP Heartbeat ping
      }
    }, 10000);
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 5000);
  }

  private cleanup(): void {
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }

  public subscribeToTableUpdates(callback: TableUpdateListener): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(update: TableStateUpdatePayload): void {
    console.log(`⚡ [Realtime Sync] Bàn ${update.tableCode || update.tableId} chuyển trạng thái -> ${update.status} (${update.color})`);
    this.listeners.forEach((listener) => {
      try {
        listener(update);
      } catch (e: any) {
        console.error('Lỗi listener WebSocket:', e);
      }
    });
  }

  /**
   * Mô phỏng phát tín hiệu đồng bộ realtime (hỗ trợ kiểm thử demo race condition trực tiếp trên giao diện)
   */
  public simulateBroadcast(update: TableStateUpdatePayload): void {
    this.notifyListeners(update);
  }

  public getConnectingState(): boolean {
    return this.isConnecting;
  }
}

export const webSocketFloorService = new WebSocketFloorService();
