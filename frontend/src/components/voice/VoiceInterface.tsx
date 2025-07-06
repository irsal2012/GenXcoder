import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Settings,
  Loader2,
  Waves,
  Play,
  Pause,
  Square
} from 'lucide-react';
import { voiceManager, VoiceConfig, SpeechRecognitionConfig } from '../../ai/voice/VoiceManager';

interface VoiceInterfaceProps {
  onTranscript: (text: string, isFinal: boolean) => void;
  onSpeakText?: (text: string) => void;
  className?: string;
  disabled?: boolean;
}

export const VoiceInterface: React.FC<VoiceInterfaceProps> = ({
  onTranscript,
  onSpeakText,
  className = "",
  disabled = false
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [voiceLevel, setVoiceLevel] = useState(0);
  
  // Voice configuration
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    language: 'en-US',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8
  });

  const [recognitionConfig, setRecognitionConfig] = useState<SpeechRecognitionConfig>({
    language: 'en-US',
    continuous: false,
    interimResults: true,
    maxAlternatives: 1
  });

  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    setIsSupported(voiceManager.isSupported);
  }, []);

  useEffect(() => {
    // Update voice manager configurations
    voiceManager.updateVoiceConfig(voiceConfig);
    voiceManager.updateRecognitionConfig(recognitionConfig);
  }, [voiceConfig, recognitionConfig]);

  const startListening = async () => {
    if (!isSupported || disabled) return;

    try {
      setError(null);
      setTranscript('');
      
      await voiceManager.startListening(
        (text, isFinal) => {
          setTranscript(text);
          onTranscript(text, isFinal);
          
          if (isFinal) {
            setIsListening(false);
          }
        },
        (error) => {
          setError(error);
          setIsListening(false);
        },
        recognitionConfig
      );
      
      setIsListening(true);
      startVoiceLevelAnimation();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start listening');
    }
  };

  const stopListening = () => {
    voiceManager.stopListening();
    setIsListening(false);
    setTranscript('');
    stopVoiceLevelAnimation();
  };

  const speakText = async (text: string) => {
    if (!isSupported || disabled) return;

    try {
      setError(null);
      setIsSpeaking(true);
      
      await voiceManager.speak(text, voiceConfig);
      setIsSpeaking(false);
      
      if (onSpeakText) {
        onSpeakText(text);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to speak text');
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    voiceManager.stopSpeaking();
    setIsSpeaking(false);
  };

  const startVoiceLevelAnimation = () => {
    const animate = () => {
      // Simulate voice level animation
      setVoiceLevel(Math.random() * 100);
      animationRef.current = requestAnimationFrame(animate);
    };
    animate();
  };

  const stopVoiceLevelAnimation = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setVoiceLevel(0);
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getAvailableVoices = () => {
    return voiceManager.getAvailableVoices();
  };

  if (!isSupported) {
    return (
      <div className={`flex items-center space-x-2 text-gray-500 ${className}`}>
        <MicOff className="w-5 h-5" />
        <span className="text-sm">Voice not supported</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Voice Level Indicator */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex items-center space-x-1"
          >
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="w-1 bg-blue-500 rounded-full"
                animate={{
                  height: [4, 8 + (voiceLevel / 100) * 16, 4],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  delay: i * 0.1,
                }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Microphone Button */}
      <motion.button
        onClick={toggleListening}
        disabled={disabled || isSpeaking}
        className={`relative p-3 rounded-full transition-all duration-200 ${
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg'
            : 'bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        {isListening ? (
          <MicOff className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}
        
        {/* Listening indicator */}
        {isListening && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-red-300"
            animate={{
              scale: [1, 1.2, 1],
              opacity: [1, 0.5, 1],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
            }}
          />
        )}
      </motion.button>

      {/* Speaker Button */}
      <motion.button
        onClick={isSpeaking ? stopSpeaking : undefined}
        disabled={disabled || isListening}
        className={`p-3 rounded-full transition-all duration-200 ${
          isSpeaking
            ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
            : 'bg-gray-200 hover:bg-gray-300 text-gray-600 shadow-md'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        {isSpeaking ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </motion.button>

      {/* Settings Button */}
      <motion.button
        onClick={() => setShowSettings(!showSettings)}
        disabled={disabled}
        className={`p-3 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 transition-all duration-200 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        }`}
        whileHover={{ scale: disabled ? 1 : 1.05 }}
        whileTap={{ scale: disabled ? 1 : 0.95 }}
      >
        <Settings className="w-5 h-5" />
      </motion.button>

      {/* Transcript Display */}
      <AnimatePresence>
        {transcript && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="flex-1 max-w-md"
          >
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <p className="text-sm text-blue-800">{transcript}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 mt-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 z-10"
          >
            <p className="text-sm text-red-800">{error}</p>
            <button
              onClick={() => setError(null)}
              className="text-red-600 hover:text-red-800 text-xs mt-1"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            className="absolute top-full right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 z-20 w-80"
          >
            <h3 className="font-semibold text-gray-900 mb-4">Voice Settings</h3>
            
            {/* Voice Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Voice
              </label>
              <select
                value={voiceConfig.voice?.name || ''}
                onChange={(e) => {
                  const voice = getAvailableVoices().find(v => v.name === e.target.value);
                  setVoiceConfig(prev => ({ ...prev, voice }));
                }}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="">Default</option>
                {getAvailableVoices().map((voice) => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>

            {/* Speech Rate */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speech Rate: {voiceConfig.rate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={voiceConfig.rate}
                onChange={(e) => setVoiceConfig(prev => ({ ...prev, rate: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>

            {/* Volume */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume: {Math.round(voiceConfig.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={voiceConfig.volume}
                onChange={(e) => setVoiceConfig(prev => ({ ...prev, volume: parseFloat(e.target.value) }))}
                className="w-full"
              />
            </div>

            {/* Language */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Language
              </label>
              <select
                value={recognitionConfig.language}
                onChange={(e) => {
                  const language = e.target.value;
                  setRecognitionConfig(prev => ({ ...prev, language }));
                  setVoiceConfig(prev => ({ ...prev, language }));
                }}
                className="w-full p-2 border border-gray-300 rounded-lg text-sm"
              >
                <option value="en-US">English (US)</option>
                <option value="en-GB">English (UK)</option>
                <option value="es-ES">Spanish</option>
                <option value="fr-FR">French</option>
                <option value="de-DE">German</option>
                <option value="it-IT">Italian</option>
                <option value="pt-BR">Portuguese (Brazil)</option>
                <option value="ja-JP">Japanese</option>
                <option value="ko-KR">Korean</option>
                <option value="zh-CN">Chinese (Simplified)</option>
              </select>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowSettings(false)}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm transition-colors"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceInterface;
