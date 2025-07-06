import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  MessageSquare, 
  Video, 
  Share2, 
  Settings,
  UserPlus,
  Crown,
  Shield,
  Eye,
  Mic,
  MicOff,
  VideoOff,
  MoreVertical,
  Copy,
  ExternalLink
} from 'lucide-react';
import { 
  collaborationService, 
  User, 
  CollaborationSession, 
  CollaborationMessage 
} from '../../services/collaboration/CollaborationService';

interface TeamCollaborationProps {
  projectId: string;
  onSessionChange?: (session: CollaborationSession | null) => void;
  className?: string;
}

export const TeamCollaboration: React.FC<TeamCollaborationProps> = ({
  projectId,
  onSessionChange,
  className = ""
}) => {
  const [currentSession, setCurrentSession] = useState<CollaborationSession | null>(null);
  const [participants, setParticipants] = useState<User[]>([]);
  const [messages, setMessages] = useState<CollaborationMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);

  // Session creation form
  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');

  useEffect(() => {
    // Initialize collaboration service
    const initializeCollaboration = async () => {
      try {
        await collaborationService.connect();
        setIsConnected(true);

        // Set up event handlers
        collaborationService.onSessionUpdate((session) => {
          setCurrentSession(session);
          setParticipants(session.participants);
          onSessionChange?.(session);
        });

        collaborationService.onUserJoined((user) => {
          setParticipants(prev => [...prev, user]);
        });

        collaborationService.onUserLeft((userId) => {
          setParticipants(prev => prev.filter(p => p.id !== userId));
        });

        collaborationService.onMessage((message) => {
          setMessages(prev => [...prev, message]);
        });

        collaborationService.onConnectionChange(setIsConnected);

        // Load existing session if any
        const existingSession = collaborationService.getCurrentSession();
        if (existingSession) {
          setCurrentSession(existingSession);
          setParticipants(existingSession.participants);
          setMessages(collaborationService.getSessionMessages());
        }

      } catch (error) {
        console.error('Failed to initialize collaboration:', error);
      }
    };

    initializeCollaboration();

    return () => {
      collaborationService.disconnect();
    };
  }, [onSessionChange]);

  const handleCreateSession = async () => {
    if (!sessionName.trim()) return;

    try {
      const session = await collaborationService.createSession(
        projectId,
        sessionName,
        sessionDescription,
        {
          allowVoiceChat: true,
          allowScreenShare: true,
          maxParticipants: 10,
          requireApproval: false
        }
      );

      setCurrentSession(session);
      setParticipants(session.participants);
      setShowCreateSession(false);
      setSessionName('');
      setSessionDescription('');
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleJoinSession = async (sessionId: string) => {
    try {
      const session = await collaborationService.joinSession(sessionId);
      setCurrentSession(session);
      setParticipants(session.participants);
      setMessages(collaborationService.getSessionMessages());
    } catch (error) {
      console.error('Failed to join session:', error);
    }
  };

  const handleLeaveSession = async () => {
    try {
      await collaborationService.leaveSession();
      setCurrentSession(null);
      setParticipants([]);
      setMessages([]);
      onSessionChange?.(null);
    } catch (error) {
      console.error('Failed to leave session:', error);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    collaborationService.sendMessage(newMessage);
    setNewMessage('');
  };

  const handleToggleVoice = async () => {
    try {
      if (isVoiceEnabled) {
        collaborationService.stopVoiceChat();
        setIsVoiceEnabled(false);
      } else {
        await collaborationService.startVoiceChat();
        setIsVoiceEnabled(true);
      }
    } catch (error) {
      console.error('Voice chat error:', error);
    }
  };

  const handleToggleScreenShare = async () => {
    try {
      if (isScreenSharing) {
        collaborationService.stopScreenShare();
        setIsScreenSharing(false);
      } else {
        await collaborationService.startScreenShare();
        setIsScreenSharing(true);
      }
    } catch (error) {
      console.error('Screen share error:', error);
    }
  };

  const copyInviteLink = () => {
    if (currentSession) {
      const inviteLink = `${window.location.origin}/collaborate/${currentSession.id}`;
      navigator.clipboard.writeText(inviteLink);
      // Show toast notification
    }
  };

  const getRoleIcon = (role: User['role']) => {
    switch (role) {
      case 'owner': return <Crown className="w-3 h-3 text-yellow-500" />;
      case 'admin': return <Shield className="w-3 h-3 text-blue-500" />;
      case 'viewer': return <Eye className="w-3 h-3 text-gray-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: User['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (!isConnected) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to collaboration service...</p>
        </div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Team Collaboration</h3>
          <p className="text-gray-600 mb-6">Start collaborating with your team in real-time</p>
          
          <div className="space-y-4">
            <button
              onClick={() => setShowCreateSession(true)}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <UserPlus className="w-5 h-5" />
              <span>Start New Session</span>
            </button>

            {/* Available Sessions */}
            {collaborationService.getAllSessions().length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Available Sessions</h4>
                <div className="space-y-2">
                  {collaborationService.getAllSessions().map((session) => (
                    <button
                      key={session.id}
                      onClick={() => handleJoinSession(session.id)}
                      className="w-full p-3 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors text-left"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900">{session.name}</p>
                          <p className="text-sm text-gray-600">{session.participants.length} participants</p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create Session Modal */}
        <AnimatePresence>
          {showCreateSession && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
              onClick={() => setShowCreateSession(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Create Collaboration Session</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Name
                    </label>
                    <input
                      type="text"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="Enter session name"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (Optional)
                    </label>
                    <textarea
                      value={sessionDescription}
                      onChange={(e) => setSessionDescription(e.target.value)}
                      placeholder="Describe what you'll be working on"
                      rows={3}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="flex space-x-3 mt-6">
                  <button
                    onClick={() => setShowCreateSession(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateSession}
                    disabled={!sessionName.trim()}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                  >
                    Create Session
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Session Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{currentSession.name}</h3>
            <p className="text-sm text-gray-600">{participants.length} participants</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Voice Chat */}
          <button
            onClick={handleToggleVoice}
            className={`p-2 rounded-lg transition-colors ${
              isVoiceEnabled 
                ? 'bg-green-100 text-green-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isVoiceEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          {/* Screen Share */}
          <button
            onClick={handleToggleScreenShare}
            className={`p-2 rounded-lg transition-colors ${
              isScreenSharing 
                ? 'bg-blue-100 text-blue-600' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
          </button>

          {/* Invite */}
          <button
            onClick={() => setShowInviteModal(true)}
            className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <UserPlus className="w-4 h-4" />
          </button>

          {/* Leave Session */}
          <button
            onClick={handleLeaveSession}
            className="p-2 bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Participants */}
      <div className="p-4 border-b border-gray-200">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Participants</h4>
        <div className="space-y-2">
          {participants.map((participant) => (
            <div key={participant.id} className="flex items-center space-x-3">
              <div className="relative">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {participant.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className={`absolute -bottom-1 -right-1 w-3 h-3 ${getStatusColor(participant.status)} rounded-full border-2 border-white`} />
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium text-gray-900">{participant.name}</span>
                  {getRoleIcon(participant.role)}
                </div>
                <span className="text-xs text-gray-500">{participant.email}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const sender = participants.find(p => p.id === message.userId);
          return (
            <div key={message.id} className="flex space-x-3">
              <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs font-medium">
                  {sender?.name.charAt(0).toUpperCase() || '?'}
                </span>
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-900">{sender?.name || 'Unknown'}</span>
                  <span className="text-xs text-gray-500">
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700">{message.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex space-x-3">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim()}
            className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setShowInviteModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Invite to Session</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Invitation Link
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={`${window.location.origin}/collaborate/${currentSession.id}`}
                      readOnly
                      className="flex-1 p-3 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button
                      onClick={copyInviteLink}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TeamCollaboration;
