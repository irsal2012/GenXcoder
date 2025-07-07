import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Box,
  Eye,
  Headphones,
  Users,
  Settings,
  Play,
  Pause,
  Square,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  Zap,
  Layers,
  Palette,
  Code,
  FileText,
  Monitor,
  Smartphone,
  Glasses,
  Gamepad2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Share,
  Download,
  Upload,
  Plus,
  Minus,
  Move3D,
  RotateCw,
  Scale,
  Target,
  Lightbulb,
  Music,
  Camera,
  Save,
  FolderOpen,
  Trash2
} from 'lucide-react';
import { metaverseService, VirtualEnvironment, MetaverseSession } from '../../services/metaverse/MetaverseService';

export const MetaverseStudio: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'environments' | 'studio' | 'sessions' | 'settings'>('environments');
  const [environments, setEnvironments] = useState<VirtualEnvironment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<VirtualEnvironment | null>(null);
  const [currentSession, setCurrentSession] = useState<MetaverseSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVRMode, setIsVRMode] = useState(false);
  const [isARMode, setIsARMode] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [micEnabled, setMicEnabled] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [vrSupported, setVRSupported] = useState(false);
  const [arSupported, setARSupported] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [sceneInitialized, setSceneInitialized] = useState(false);

  useEffect(() => {
    loadData();
    checkCapabilities();
  }, []);

  const loadData = async () => {
    try {
      const environmentsData = await metaverseService.getEnvironments();
      setEnvironments(environmentsData);
      
      if (environmentsData.length > 0 && !selectedEnvironment) {
        setSelectedEnvironment(environmentsData[0]);
      }
    } catch (error) {
      console.error('Failed to load metaverse data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkCapabilities = () => {
    setVRSupported(metaverseService.isVRSupported());
    setARSupported(metaverseService.isARSupported());
  };

  const initializeScene = async () => {
    if (!selectedEnvironment || !canvasRef.current || sceneInitialized) return;

    try {
      const success = await metaverseService.initializeScene(selectedEnvironment.id, canvasRef.current);
      if (success) {
        setSceneInitialized(true);
        
        // Start a session
        const session = await metaverseService.startSession(selectedEnvironment.id, 'user-1');
        setCurrentSession(session);
      }
    } catch (error) {
      console.error('Failed to initialize 3D scene:', error);
    }
  };

  const toggleVR = async () => {
    if (!vrSupported) return;
    
    if (!isVRMode) {
      const success = await metaverseService.enableVR();
      setIsVRMode(success);
    } else {
      setIsVRMode(false);
    }
  };

  const toggleAR = async () => {
    if (!arSupported) return;
    
    if (!isARMode) {
      const success = await metaverseService.enableAR();
      setIsARMode(success);
    } else {
      setIsARMode(false);
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const createNewEnvironment = async () => {
    try {
      const newEnv = await metaverseService.createEnvironment({
        name: `Environment ${environments.length + 1}`,
        type: 'workspace',
        theme: 'minimal',
        dimensions: { width: 20, height: 10, depth: 20 },
        objects: [],
        lighting: {
          ambient: { color: '#ffffff', intensity: 0.6 },
          directional: [],
          point: [],
          spot: []
        },
        physics: { enabled: false, gravity: { x: 0, y: -9.8, z: 0 } as any, collisionDetection: false, constraints: [] },
        audio: { enabled: true, spatialAudio: true, ambientSounds: [], volume: 0.5 },
        participants: [],
        settings: {
          maxParticipants: 10,
          privacy: 'private',
          permissions: { canEdit: true, canInvite: true, canRecord: false, canExport: true },
          features: { aiAssistants: true, voiceChat: true, screenSharing: true, fileSharing: true, realTimeSync: true }
        }
      });
      
      setEnvironments([...environments, newEnv]);
      setSelectedEnvironment(newEnv);
    } catch (error) {
      console.error('Failed to create environment:', error);
    }
  };

  const renderEnvironments = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Virtual Environments</h3>
        <button
          onClick={createNewEnvironment}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Environment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {environments.map((env) => (
          <motion.div
            key={env.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl shadow-sm border-2 p-6 cursor-pointer transition-all duration-300 ${
              selectedEnvironment?.id === env.id
                ? 'border-blue-500 shadow-lg'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            }`}
            onClick={() => setSelectedEnvironment(env)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${
                  env.theme === 'cyberpunk' ? 'bg-purple-100 text-purple-600' :
                  env.theme === 'minimal' ? 'bg-gray-100 text-gray-600' :
                  env.theme === 'nature' ? 'bg-green-100 text-green-600' :
                  env.theme === 'space' ? 'bg-blue-100 text-blue-600' :
                  'bg-orange-100 text-orange-600'
                }`}>
                  <Box className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900">{env.name}</h4>
                  <p className="text-sm text-gray-600 capitalize">{env.type} • {env.theme}</p>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4 text-gray-400" />
                <span className="text-sm text-gray-600">{env.participants.length}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Width</p>
                  <p className="font-semibold text-gray-900">{env.dimensions.width}m</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Height</p>
                  <p className="font-semibold text-gray-900">{env.dimensions.height}m</p>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-600">Depth</p>
                  <p className="font-semibold text-gray-900">{env.dimensions.depth}m</p>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <Layers className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{env.objects.length} objects</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Lightbulb className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">
                    {env.lighting.directional.length + env.lighting.point.length + env.lighting.spot.length} lights
                  </span>
                </div>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedEnvironment(env);
                    setSelectedTab('studio');
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                >
                  <Play className="w-4 h-4" />
                  <span>Enter</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Edit environment
                  }}
                  className="flex items-center justify-center px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderStudio = () => (
    <div className="space-y-6">
      {/* Studio Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {selectedEnvironment?.name || 'Metaverse Studio'}
          </h3>
          {currentSession && (
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-lg text-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live Session</span>
            </div>
          )}
        </div>

        {/* Studio Controls */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              audioEnabled ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
            }`}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setMicEnabled(!micEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              micEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {micEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setVideoEnabled(!videoEnabled)}
            className={`p-2 rounded-lg transition-colors ${
              videoEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {videoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
          </button>

          <div className="w-px h-6 bg-gray-300"></div>

          {vrSupported && (
            <button
              onClick={toggleVR}
              className={`p-2 rounded-lg transition-colors ${
                isVRMode ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-600'
              }`}
              title="Toggle VR Mode"
            >
              <Glasses className="w-4 h-4" />
            </button>
          )}

          {arSupported && (
            <button
              onClick={toggleAR}
              className={`p-2 rounded-lg transition-colors ${
                isARMode ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              }`}
              title="Toggle AR Mode"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={toggleFullscreen}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="relative bg-black rounded-2xl overflow-hidden" style={{ height: '600px' }}>
        <div
          ref={canvasRef}
          className="w-full h-full"
          onClick={initializeScene}
        />
        
        {!sceneInitialized && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-center text-white">
              <Box className="w-12 h-12 mx-auto mb-4 animate-spin" />
              <p className="text-lg font-semibold mb-2">Click to Enter Metaverse</p>
              <p className="text-sm opacity-75">Initialize 3D environment</p>
            </div>
          </div>
        )}

        {/* 3D Controls Overlay */}
        {sceneInitialized && (
          <div className="absolute top-4 left-4 space-y-2">
            <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-2">
              <div className="grid grid-cols-3 gap-1">
                <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors" title="Move">
                  <Move3D className="w-4 h-4" />
                </button>
                <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors" title="Rotate">
                  <RotateCw className="w-4 h-4" />
                </button>
                <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors" title="Scale">
                  <Scale className="w-4 h-4" />
                </button>
                <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors" title="Add Object">
                  <Plus className="w-4 h-4" />
                </button>
                <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors" title="Camera">
                  <Camera className="w-4 h-4" />
                </button>
                <button className="p-2 text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors" title="Lighting">
                  <Lightbulb className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Environment Info Overlay */}
        {sceneInitialized && selectedEnvironment && (
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-3 text-white">
            <div className="text-sm space-y-1">
              <div className="flex items-center space-x-2">
                <Box className="w-4 h-4" />
                <span>{selectedEnvironment.name}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>{selectedEnvironment.participants.length} participants</span>
              </div>
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4" />
                <span>{selectedEnvironment.objects.length} objects</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tool Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Objects Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Layers className="w-4 h-4" />
            <span>Objects</span>
          </h4>
          <div className="space-y-2">
            <button className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <Code className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Code Block</span>
            </button>
            <button className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <FileText className="w-4 h-4 text-green-600" />
              <span className="text-sm">File System</span>
            </button>
            <button className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <Zap className="w-4 h-4 text-purple-600" />
              <span className="text-sm">AI Agent</span>
            </button>
            <button className="w-full flex items-center space-x-2 p-2 text-left hover:bg-gray-50 rounded-lg transition-colors">
              <Target className="w-4 h-4 text-orange-600" />
              <span className="text-sm">Data Viz</span>
            </button>
          </div>
        </div>

        {/* Materials Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Palette className="w-4 h-4" />
            <span>Materials</span>
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-gray-100 rounded-lg text-center cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="w-full h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded mb-1"></div>
              <span className="text-xs">Standard</span>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg text-center cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="w-full h-8 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded mb-1 opacity-70"></div>
              <span className="text-xs">Glass</span>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg text-center cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="w-full h-8 bg-gradient-to-r from-purple-400 to-pink-600 rounded mb-1"></div>
              <span className="text-xs">Neon</span>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg text-center cursor-pointer hover:bg-gray-200 transition-colors">
              <div className="w-full h-8 bg-gradient-to-r from-blue-400 to-cyan-400 rounded mb-1 border border-dashed border-blue-600"></div>
              <span className="text-xs">Hologram</span>
            </div>
          </div>
        </div>

        {/* Lighting Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Lightbulb className="w-4 h-4" />
            <span>Lighting</span>
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Ambient</span>
              <input type="range" min="0" max="100" defaultValue="60" className="w-16" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Directional</span>
              <input type="range" min="0" max="100" defaultValue="80" className="w-16" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Point</span>
              <input type="range" min="0" max="100" defaultValue="40" className="w-16" />
            </div>
            <button className="w-full flex items-center justify-center space-x-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Plus className="w-4 h-4" />
              <span>Add Light</span>
            </button>
          </div>
        </div>

        {/* Audio Panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center space-x-2">
            <Music className="w-4 h-4" />
            <span>Audio</span>
          </h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Master Volume</span>
              <input type="range" min="0" max="100" defaultValue="70" className="w-16" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Spatial Audio</span>
              <input type="checkbox" defaultChecked className="rounded" />
            </div>
            <button className="w-full flex items-center justify-center space-x-2 p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm">
              <Upload className="w-4 h-4" />
              <span>Upload Audio</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSessions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Active Sessions</h3>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            {currentSession ? 'Session Active' : 'No Active Session'}
          </div>
        </div>
      </div>

      {currentSession ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <div>
                <h4 className="font-semibold text-gray-900">Current Session</h4>
                <p className="text-sm text-gray-600">Started {currentSession.startTime.toLocaleTimeString()}</p>
              </div>
            </div>
            <button
              onClick={() => {
                metaverseService.endSession(currentSession.id);
                setCurrentSession(null);
              }}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              <Square className="w-4 h-4" />
              <span>End Session</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Participants</p>
              <p className="text-2xl font-bold text-gray-900">{currentSession.participants.length}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Activities</p>
              <p className="text-2xl font-bold text-gray-900">{currentSession.activities.length}</p>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Duration</p>
              <p className="text-2xl font-bold text-gray-900">
                {Math.floor((Date.now() - currentSession.startTime.getTime()) / 60000)}m
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Sessions</h3>
          <p className="text-gray-600">Enter a virtual environment to start a session</p>
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading Metaverse Studio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-purple-100 rounded-xl">
                <Box className="w-8 h-8 text-purple-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Metaverse Studio</h1>
                <p className="text-gray-600">Immersive 3D development environments</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Box className="w-4 h-4" />
                  <span>{environments.length} Environments</span>
                </div>
                {vrSupported && (
                  <div className="flex items-center space-x-1">
                    <Glasses className="w-4 h-4" />
                    <span>VR Ready</span>
                  </div>
                )}
                {arSupported && (
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>AR Ready</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'environments', label: 'Environments', icon: Box },
            { id: 'studio', label: 'Studio', icon: Monitor },
            { id: 'sessions', label: 'Sessions', icon: Users },
            { id: 'settings', label: 'Settings', icon: Settings }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                selectedTab === tab.id
                  ? 'bg-white text-purple-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 pb-12">
        {selectedTab === 'environments' && renderEnvironments()}
        {selectedTab === 'studio' && renderStudio()}
        {selectedTab === 'sessions' && renderSessions()}
        {selectedTab === 'settings' && (
          <div className="text-center py-12">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Metaverse Settings</h3>
            <p className="text-gray-600">Configure your metaverse preferences and environment settings</p>
          </div>
        )}
      </div>
    </div>
  );
};
