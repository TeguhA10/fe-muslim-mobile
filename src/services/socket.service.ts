// @ts-ignore
import { io, Socket } from 'socket.io-client/dist/socket.io.js';
import { Platform } from 'react-native';
import { useNotificationStore } from '../store/useNotificationStore';
import { useAuthStore } from '../store/useAuthStore';

const getSocketUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;

  if (envUrl) {
    let host = envUrl.replace('/api/v1', '').replace('/api', '');
    if (Platform.OS === 'android' && host.includes('localhost')) {
      host = host.replace('localhost', '10.0.2.2');
    }
    return host;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
};

class SocketService {
  private socket: any | null = null;
  private currentUserId: string | null = null;

  connect(userId: string) {
    if (this.socket && this.currentUserId === userId) return;

    this.disconnect();

    const socketUrl = getSocketUrl();
    console.log('[SocketService] Connecting to Socket.IO at:', socketUrl);

    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.currentUserId = userId;

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected with socket ID:', this.socket?.id);
      if (this.currentUserId) {
        this.socket?.emit('join_user', this.currentUserId);
      }
    });

    // Listen for real-time notification events!
    this.socket.on('notification:new', (notificationData: any) => {
      console.log('[SocketService] Received real-time notification:', notificationData);
      const isAuth = useAuthStore.getState().isAuthenticated;
      if (isAuth) {
        useNotificationStore.getState().fetchUnreadCount();
        useNotificationStore.getState().fetchNotifications(1, true);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('[SocketService] Socket disconnected');
    });

    this.socket.on('connect_error', (err: any) => {
      console.log('[SocketService] Connection error:', err?.message || err);
    });
  }

  disconnect() {
    if (this.socket) {
      if (this.currentUserId) {
        this.socket.emit('leave_user', this.currentUserId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
      console.log('[SocketService] Disconnected and cleaned up');
    }
  }
}

export const socketService = new SocketService();
