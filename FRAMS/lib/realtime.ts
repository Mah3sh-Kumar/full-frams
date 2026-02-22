/**
 * Real-time Attendance Synchronization Service
 * Implements WebSocket infrastructure for live attendance updates between systems
 */

import { supabase } from './supabase';

export interface AttendanceEvent {
  id: string;
  student_id: string;
  subject_id: string | null;
  date: string;
  status: 'present' | 'absent' | 'late';
  timestamp: string;
  device_id: string | null;
  source: 'auto' | 'manual';
  created_at: string;
  updated_at: string;
}

export interface RealtimeConfig {
  enabled: boolean;
  reconnectInterval: number;
  maxRetries: number;
  heartbeatInterval: number;
}

export interface ConnectionState {
  connected: boolean;
  lastHeartbeat: Date | null;
  retryCount: number;
  error?: string;
}

// Simple event emitter for React Native
class EventEmitter {
  private listeners: Map<string, Function[]> = new Map();

  on(event: string, listener: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(listener);
  }

  off(event: string, listener: Function): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(listener => listener(...args));
    }
  }
}

export class RealtimeAttendanceService extends EventEmitter {
  private static instance: RealtimeAttendanceService;
  private config: RealtimeConfig;
  private connectionState: ConnectionState;
  private subscription: any = null;
  private heartbeatTimer: any = null;
  private reconnectTimer: any = null;

  private constructor(config?: Partial<RealtimeConfig>) {
    super();
    this.config = {
      enabled: true,
      reconnectInterval: 5000,
      maxRetries: 10,
      heartbeatInterval: 30000,
      ...config
    };
    
    this.connectionState = {
      connected: false,
      lastHeartbeat: null,
      retryCount: 0
    };
  }

  static getInstance(config?: Partial<RealtimeConfig>): RealtimeAttendanceService {
    if (!RealtimeAttendanceService.instance) {
      RealtimeAttendanceService.instance = new RealtimeAttendanceService(config);
    }
    return RealtimeAttendanceService.instance;
  }

  /**
   * Initialize real-time subscription
   */
  async initialize(): Promise<boolean> {
    if (!this.config.enabled) {
      console.log('Real-time service is disabled');
      return false;
    }

    try {
      await this.subscribeToAttendanceChanges();
      this.startHeartbeat();
      this.connectionState.connected = true;
      this.connectionState.retryCount = 0;
      this.emit('connected');
      console.log('✓ Real-time attendance service initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize real-time service:', error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Subscribe to attendance table changes
   */
  private async subscribeToAttendanceChanges(): Promise<void> {
    // Unsubscribe existing subscription
    if (this.subscription) {
      await this.unsubscribe();
    }

    try {
      this.subscription = supabase
        .channel('attendance-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'attendance'
          },
          (payload: any) => {
            this.handleAttendanceChangeEvent(payload);
          }
        )
        .subscribe((status: string, err: any) => {
          if (status === 'SUBSCRIBED') {
            console.log('✓ Subscribed to attendance changes');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Channel error:', err);
            this.handleError(err);
          } else if (status === 'CLOSED') {
            console.log('Subscription closed');
            this.connectionState.connected = false;
            this.emit('disconnected');
          }
        });
    } catch (error) {
      throw new Error(`Subscription failed: ${(error as Error).message}`);
    }
  }

  /**
   * Handle attendance change events
   */
  private handleAttendanceChangeEvent(payload: any): void {
    const { eventType, new: newRecord, old: oldRecord } = payload;
    
    const event: AttendanceEvent = {
      id: newRecord?.id || oldRecord?.id,
      student_id: newRecord?.student_id || oldRecord?.student_id,
      subject_id: newRecord?.subject_id || oldRecord?.subject_id,
      date: newRecord?.date || oldRecord?.date,
      status: newRecord?.status || oldRecord?.status,
      timestamp: newRecord?.timestamp || oldRecord?.timestamp,
      device_id: newRecord?.device_id || oldRecord?.device_id,
      source: this.determineSource(newRecord, oldRecord),
      created_at: newRecord?.created_at || oldRecord?.created_at,
      updated_at: newRecord?.updated_at || new Date().toISOString()
    };

    // Emit specific events based on operation type
    switch (eventType) {
      case 'INSERT':
        this.emit('attendance.created', event);
        this.emit('attendance.changed', { type: 'created', event });
        break;
      case 'UPDATE':
        this.emit('attendance.updated', event);
        this.emit('attendance.changed', { type: 'updated', event });
        break;
      case 'DELETE':
        this.emit('attendance.deleted', event);
        this.emit('attendance.changed', { type: 'deleted', event });
        break;
    }

    // Emit general event for all changes
    this.emit('attendance.any', event);
    
    console.log(`Attendance ${eventType}:`, {
      student_id: event.student_id,
      status: event.status,
      source: event.source
    });
  }

  /**
   * Determine the source of the attendance record
   */
  private determineSource(newRecord: any, oldRecord: any): 'auto' | 'manual' {
    // Logic to determine if attendance was auto-generated (Face_Reco) or manual (FRAMS)
    if (newRecord?.device_id) {
      // Records with device_id are typically auto-generated
      return 'auto';
    }
    
    if (oldRecord && newRecord) {
      // If updating an existing record without device_id, likely manual
      const timeDiff = new Date(newRecord.timestamp).getTime() - new Date(oldRecord.timestamp).getTime();
      if (Math.abs(timeDiff) < 60000) { // Within 1 minute
        return 'manual'; // Quick manual correction
      }
    }
    
    return 'manual'; // Default to manual if uncertain
  }

  /**
   * Send attendance update to other systems
   */
  async broadcastAttendanceUpdate(event: Omit<AttendanceEvent, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> {
    try {
      // In a full implementation, this would send to a message queue or WebSocket server
      const fullEvent: AttendanceEvent = {
        ...event,
        id: `broadcast_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      this.emit('attendance.broadcast', fullEvent);
      return true;
    } catch (error) {
      console.error('Failed to broadcast attendance update:', error);
      return false;
    }
  }

  /**
   * Start heartbeat to monitor connection health
   */
  private startHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }

    this.heartbeatTimer = setInterval(() => {
      if (this.connectionState.connected) {
        this.connectionState.lastHeartbeat = new Date();
        this.emit('heartbeat');
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Handle connection errors and attempt reconnection
   */
  private handleError(error: any): void {
    this.connectionState.error = (error as Error).message;
    this.emit('error', error);
    
    if (this.connectionState.retryCount < this.config.maxRetries) {
      this.attemptReconnect();
    } else {
      console.error('Max retries reached. Giving up on reconnection.');
      this.emit('maxRetriesReached');
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.connectionState.retryCount++;
    const delay = Math.min(
      this.config.reconnectInterval * Math.pow(2, this.connectionState.retryCount),
      60000 // Max 60 seconds
    );

    console.log(`Attempting reconnection in ${delay}ms (attempt ${this.connectionState.retryCount})`);
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.initialize();
      } catch (error) {
        this.handleError(error);
      }
    }, delay);
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    console.log('Cleaning up real-time service...');
    
    this.stopHeartbeat();
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    await this.unsubscribe();
    
    this.connectionState.connected = false;
    this.emit('cleanup');
  }

  /**
   * Unsubscribe from channel
   */
  private async unsubscribe(): Promise<void> {
    if (this.subscription) {
      try {
        await supabase.removeChannel(this.subscription);
        this.subscription = null;
        console.log('Unsubscribed from attendance changes');
      } catch (error) {
        console.error('Error unsubscribing:', error);
      }
    }
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Force reconnection
   */
  async reconnect(): Promise<boolean> {
    await this.cleanup();
    this.connectionState.retryCount = 0;
    return await this.initialize();
  }

  /**
   * Enable/disable real-time service
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
    if (!enabled) {
      this.cleanup();
    } else {
      this.initialize();
    }
  }
}

// Export singleton instance
export const realtimeAttendanceService = RealtimeAttendanceService.getInstance();

// Export types
export type { AttendanceEvent, RealtimeConfig, ConnectionState };
export default realtimeAttendanceService;