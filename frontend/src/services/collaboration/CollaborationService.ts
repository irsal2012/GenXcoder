import { v4 as uuidv4 } from 'uuid';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  status: 'online' | 'away' | 'offline';
  lastSeen: Date;
  cursor?: {
    x: number;
    y: number;
    element?: string;
  };
}

export interface CollaborationSession {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdBy: string;
  createdAt: Date;
  participants: User[];
  isActive: boolean;
  settings: {
    allowVoiceChat: boolean;
    allowScreenShare: boolean;
    maxParticipants: number;
    requireApproval: boolean;
  };
}

export interface CollaborationMessage {
  id: string;
  sessionId: string;
  userId: string;
  type: 'chat' | 'system' | 'voice' | 'cursor' | 'edit' | 'join' | 'leave';
  content: any;
  timestamp: Date;
  metadata?: {
    elementId?: string;
    position?: { x: number; y: number };
    voiceData?: ArrayBuffer;
    editType?: 'insert' | 'delete' | 'replace';
  };
}

export interface CursorPosition {
  userId: string;
  x: number;
  y: number;
  elementId?: string;
  timestamp: Date;
}

export interface EditOperation {
  id: string;
  userId: string;
  type: 'insert' | 'delete' | 'replace';
  position: number;
  content: string;
  timestamp: Date;
  elementId: string;
}

export class CollaborationService {
  private currentSession: CollaborationSession | null = null;
  private currentUser: User | null = null;
  private isConnected: boolean = false;
  private sessions: Map<string, CollaborationSession> = new Map();
  private messages: Map<string, CollaborationMessage[]> = new Map();
  
  // Event handlers
  private onUserJoinedHandler?: (user: User) => void;
  private onUserLeftHandler?: (userId: string) => void;
  private onMessageHandler?: (message: CollaborationMessage) => void;
  private onCursorMoveHandler?: (cursor: CursorPosition) => void;
  private onEditHandler?: (edit: EditOperation) => void;
  private onConnectionChangeHandler?: (connected: boolean) => void;
  private onSessionUpdateHandler?: (session: CollaborationSession) => void;

  constructor() {
    this.setupEventListeners();
    this.loadFromStorage();
  }

  // Connection Management (Mock implementation)
  async connect(serverUrl: string = 'ws://localhost:3001'): Promise<void> {
    // Simulate connection
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.isConnected = true;
    this.onConnectionChangeHandler?.(true);
  }

  disconnect(): void {
    this.isConnected = false;
    this.currentSession = null;
    this.onConnectionChangeHandler?.(false);
  }

  // Session Management
  async createSession(
    projectId: string,
    name: string,
    description?: string,
    settings?: Partial<CollaborationSession['settings']>
  ): Promise<CollaborationSession> {
    if (!this.currentUser) {
      throw new Error('User not set');
    }

    const session: CollaborationSession = {
      id: uuidv4(),
      projectId,
      name,
      description,
      createdBy: this.currentUser.id,
      createdAt: new Date(),
      participants: [this.currentUser],
      isActive: true,
      settings: {
        allowVoiceChat: true,
        allowScreenShare: true,
        maxParticipants: 10,
        requireApproval: false,
        ...settings
      }
    };

    this.sessions.set(session.id, session);
    this.messages.set(session.id, []);
    this.currentSession = session;
    this.saveToStorage();
    this.onSessionUpdateHandler?.(session);

    return session;
  }

  async joinSession(sessionId: string): Promise<CollaborationSession> {
    if (!this.currentUser) {
      throw new Error('User not set');
    }

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.participants.find(p => p.id === this.currentUser!.id)) {
      session.participants.push(this.currentUser);
      this.onUserJoinedHandler?.(this.currentUser);
    }

    this.currentSession = session;
    this.saveToStorage();
    this.onSessionUpdateHandler?.(session);

    return session;
  }

  async leaveSession(): Promise<void> {
    if (!this.currentSession || !this.currentUser) {
      return;
    }

    const session = this.currentSession;
    session.participants = session.participants.filter(p => p.id !== this.currentUser!.id);
    
    this.onUserLeftHandler?.(this.currentUser.id);
    this.currentSession = null;
    this.saveToStorage();
  }

  // Real-time Communication (Mock implementation)
  sendMessage(content: string, type: CollaborationMessage['type'] = 'chat'): void {
    if (!this.currentSession || !this.currentUser) {
      throw new Error('Not connected to session');
    }

    const message: CollaborationMessage = {
      id: uuidv4(),
      sessionId: this.currentSession.id,
      userId: this.currentUser.id,
      type,
      content,
      timestamp: new Date()
    };

    const sessionMessages = this.messages.get(this.currentSession.id) || [];
    sessionMessages.push(message);
    this.messages.set(this.currentSession.id, sessionMessages);

    this.onMessageHandler?.(message);
    this.saveToStorage();
  }

  sendCursorPosition(x: number, y: number, elementId?: string): void {
    if (!this.currentSession || !this.currentUser) {
      return;
    }

    const cursor: CursorPosition = {
      userId: this.currentUser.id,
      x,
      y,
      elementId,
      timestamp: new Date()
    };

    this.onCursorMoveHandler?.(cursor);
  }

  sendEdit(
    elementId: string,
    type: EditOperation['type'],
    position: number,
    content: string
  ): void {
    if (!this.currentSession || !this.currentUser) {
      return;
    }

    const edit: EditOperation = {
      id: uuidv4(),
      userId: this.currentUser.id,
      type,
      position,
      content,
      elementId,
      timestamp: new Date()
    };

    this.onEditHandler?.(edit);
  }

  // Voice Communication (Mock implementation)
  async startVoiceChat(): Promise<MediaStream> {
    if (!this.currentSession?.settings.allowVoiceChat) {
      throw new Error('Voice chat not allowed in this session');
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      return stream;
    } catch (error) {
      throw new Error(`Failed to start voice chat: ${error}`);
    }
  }

  stopVoiceChat(): void {
    // Mock implementation
  }

  // Screen Sharing (Mock implementation)
  async startScreenShare(): Promise<MediaStream> {
    if (!this.currentSession?.settings.allowScreenShare) {
      throw new Error('Screen sharing not allowed in this session');
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });

      return stream;
    } catch (error) {
      throw new Error(`Failed to start screen sharing: ${error}`);
    }
  }

  stopScreenShare(): void {
    // Mock implementation
  }

  // User Management
  setCurrentUser(user: User): void {
    this.currentUser = user;
    this.saveToStorage();
  }

  getCurrentUser(): User | null {
    return this.currentUser;
  }

  getCurrentSession(): CollaborationSession | null {
    return this.currentSession;
  }

  getParticipants(): User[] {
    return this.currentSession?.participants || [];
  }

  getSessionMessages(sessionId?: string): CollaborationMessage[] {
    const id = sessionId || this.currentSession?.id;
    if (!id) return [];
    return this.messages.get(id) || [];
  }

  getAllSessions(): CollaborationSession[] {
    return Array.from(this.sessions.values());
  }

  // Event Handlers
  onUserJoined(handler: (user: User) => void): void {
    this.onUserJoinedHandler = handler;
  }

  onUserLeft(handler: (userId: string) => void): void {
    this.onUserLeftHandler = handler;
  }

  onMessage(handler: (message: CollaborationMessage) => void): void {
    this.onMessageHandler = handler;
  }

  onCursorMove(handler: (cursor: CursorPosition) => void): void {
    this.onCursorMoveHandler = handler;
  }

  onEdit(handler: (edit: EditOperation) => void): void {
    this.onEditHandler = handler;
  }

  onConnectionChange(handler: (connected: boolean) => void): void {
    this.onConnectionChangeHandler = handler;
  }

  onSessionUpdate(handler: (session: CollaborationSession) => void): void {
    this.onSessionUpdateHandler = handler;
  }

  // Private Methods
  private setupEventListeners(): void {
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (this.currentUser) {
        const status = document.hidden ? 'away' : 'online';
        this.updateUserStatus(status);
      }
    });
  }

  private updateUserStatus(status: User['status']): void {
    if (this.currentUser) {
      this.currentUser.status = status;
      this.currentUser.lastSeen = new Date();
      this.saveToStorage();
    }
  }

  // Utility Methods
  getIsConnected(): boolean {
    return this.isConnected;
  }

  getConnectionStatus(): 'connected' | 'connecting' | 'disconnected' | 'error' {
    return this.isConnected ? 'connected' : 'disconnected';
  }

  // Session Analytics
  getSessionAnalytics(): {
    duration: number;
    messageCount: number;
    participantCount: number;
    voiceMinutes: number;
    screenShareMinutes: number;
  } {
    const messages = this.getSessionMessages();
    return {
      duration: this.currentSession ? 
        Date.now() - this.currentSession.createdAt.getTime() : 0,
      messageCount: messages.length,
      participantCount: this.currentSession?.participants.length || 0,
      voiceMinutes: 0, // Would be tracked in real implementation
      screenShareMinutes: 0 // Would be tracked in real implementation
    };
  }

  // Storage Management
  private saveToStorage(): void {
    try {
      const data = {
        currentUser: this.currentUser,
        sessions: Array.from(this.sessions.entries()),
        messages: Array.from(this.messages.entries()),
        lastUpdated: new Date().toISOString()
      };
      localStorage.setItem('genxcoder-collaboration', JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to save collaboration data:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const data = localStorage.getItem('genxcoder-collaboration');
      if (data) {
        const parsed = JSON.parse(data);
        this.currentUser = parsed.currentUser;
        this.sessions = new Map(parsed.sessions || []);
        this.messages = new Map(parsed.messages || []);

        // Convert date strings back to Date objects
        this.sessions.forEach(session => {
          session.createdAt = new Date(session.createdAt);
          session.participants.forEach(participant => {
            participant.lastSeen = new Date(participant.lastSeen);
          });
        });

        this.messages.forEach(sessionMessages => {
          sessionMessages.forEach(message => {
            message.timestamp = new Date(message.timestamp);
          });
        });
      }
    } catch (error) {
      console.warn('Failed to load collaboration data:', error);
    }
  }

  // Mock user creation for demo purposes
  createMockUser(name: string, email: string): User {
    return {
      id: uuidv4(),
      name,
      email,
      role: 'member',
      status: 'online',
      lastSeen: new Date()
    };
  }

  // Clear all data
  clearAllData(): void {
    this.sessions.clear();
    this.messages.clear();
    this.currentUser = null;
    this.currentSession = null;
    localStorage.removeItem('genxcoder-collaboration');
  }
}

// Singleton instance
export const collaborationService = new CollaborationService();
