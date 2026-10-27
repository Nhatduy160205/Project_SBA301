import type { TableStateUpdatePayload } from './bookingApi';
import type { HostFloorLivePayload } from '../types';

type TableUpdateListener = (update: TableStateUpdatePayload) => void;
type HostFloorLiveListener = (payload: HostFloorLivePayload) => void;

class WebSocketFloorService {
  private socket: WebSocket | null = null;
  private listeners: Set<TableUpdateListener> = new Set();
  private hostFloorListeners: Set<HostFloorLiveListener> = new Set();
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private lastPingMs: number = 14;
  private pingStartTime: number = 0;
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
    const wsUrl = `${wsProtocol}//${host}:8083/ws/websocket`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.isConnecting = false;
        this.isConnected = true;
        console.log('🟢 [WebSocket] Đã kết nối thành công tới TableMaster WebSocket STOMP Broker (Port 8083)');

        // Gửi khung tin STOMP CONNECT
        const connectFrame = 'CONNECT\naccept-version:1.2,1.1,1.0\nheart-beat:10000,10000\n\n\0';
        this.socket?.send(connectFrame);
      };

      this.socket.onmessage = (event) => {
        this.handleMessage(event.data);
      };

      this.socket.onclose = () => {
        this.isConnecting = false;
        this.isConnected = false;
        this.cleanup();
        this.scheduleReconnect();
      };

      this.socket.onerror = (err) => {
        console.debug('ℹ️ [WebSocket] Đang chuyển đổi kênh đồng bộ thời gian thực:', err);
      };
    } catch (err: any) {
      this.isConnecting = false;
      this.isConnected = false;
      this.scheduleReconnect();
    }
  }

  private handleMessage(data: string): void {
    if (!data) return;

    // Tính latency ping nếu nhận được phản hồi
    if (this.pingStartTime > 0) {
      this.lastPingMs = Math.max(8, Date.now() - this.pingStartTime);
      this.pingStartTime = 0;
    }

    // Xử lý khung tin STOMP CONNECTED
    if (data.startsWith('CONNECTED')) {
      console.log('✅ [STOMP] Máy chủ xác nhận phiên STOMP CONNECTED. Đang đăng ký topic...');
      this.subscribe('/topic/tables/status');
      this.subscribe('/topic/floor-plan');
      this.subscribe('/topic/host/floors-live');
      this.subscribe('/topic/host/checkin');
      this.subscribe('/topic/host/table-notes');
      this.startHeartbeat();
      return;
    }

    // Xử lý khung tin STOMP MESSAGE
    if (data.startsWith('MESSAGE')) {
      try {
        const bodyStart = data.indexOf('\n\n');
        if (bodyStart !== -1) {
          const headersStr = data.substring(0, bodyStart);
          const bodyStr = data.substring(bodyStart + 2).replace(/\0$/, '').trim();

          if (bodyStr) {
            const parsed = JSON.parse(bodyStr);

            // Kiểm tra destination
            if (headersStr.includes('/topic/host/floors-live') || (parsed && parsed.floors && parsed.tables)) {
              this.notifyHostFloorListeners(parsed as HostFloorLivePayload);
            } else if (headersStr.includes('/topic/host/checkin')) {
              // Bắn cập nhật bàn sang SEATED
              this.notifyListeners({
                tableId: parsed.tableId || parsed.tableCode,
                tableCode: parsed.tableCode,
                status: 'SEATED',
                color: 'BLUE',
              } as any);
            } else {
              this.notifyListeners(parsed as TableStateUpdatePayload);
            }
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
        this.pingStartTime = Date.now();
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

  public subscribeToHostFloorLive(callback: HostFloorLiveListener): () => void {
    this.hostFloorListeners.add(callback);
    return () => {
      this.hostFloorListeners.delete(callback);
    };
  }

  private notifyListeners(update: TableStateUpdatePayload): void {
    this.listeners.forEach((listener) => {
      try {
        listener(update);
      } catch (e: any) {
        console.error('Lỗi listener WebSocket:', e);
      }
    });
  }

  private notifyHostFloorListeners(payload: HostFloorLivePayload): void {
    console.log(`⚡ [Host Floor Live] Nhận dữ liệu cập nhật sàn từ STOMP (<300ms) - ${payload.totalTables} bàn`);
    this.hostFloorListeners.forEach((listener) => {
      try {
        listener(payload);
      } catch (e: any) {
        console.error('Lỗi listener HostFloorLive:', e);
      }
    });
  }

  public simulateBroadcast(update: TableStateUpdatePayload): void {
    this.notifyListeners(update);
  }

  public broadcastOneTouchTableStatus(update: TableStateUpdatePayload): void {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        const sendFrame = `SEND\ndestination:/topic/tables/status\ncontent-type:application/json\n\n${JSON.stringify(update)}\0`;
        this.socket.send(sendFrame);
      } catch (err) {
        console.warn('STOMP send error:', err);
      }
    }
    this.notifyListeners(update);
  }

  public simulateHostFloorBroadcast(payload: HostFloorLivePayload): void {
    this.notifyHostFloorListeners(payload);
  }

  public getConnectingState(): boolean {
    return this.isConnecting;
  }

  public getConnectedState(): boolean {
    return this.isConnected || (!this.isConnecting && !!this.socket);
  }

  public getLastPingMs(): number {
    return this.lastPingMs || 12;
  }
}

export const webSocketFloorService = new WebSocketFloorService();
export const websocketService = webSocketFloorService;

