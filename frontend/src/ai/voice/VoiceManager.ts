export interface VoiceConfig {
  language: string;
  voice?: SpeechSynthesisVoice;
  rate: number;
  pitch: number;
  volume: number;
}

export interface SpeechRecognitionConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export class VoiceManager {
  private synthesis: SpeechSynthesis;
  private recognition: any; // SpeechRecognition
  private isListening: boolean = false;
  private isSpeaking: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  
  private defaultVoiceConfig: VoiceConfig = {
    language: 'en-US',
    rate: 1.0,
    pitch: 1.0,
    volume: 0.8
  };

  private defaultRecognitionConfig: SpeechRecognitionConfig = {
    language: 'en-US',
    continuous: false,
    interimResults: true,
    maxAlternatives: 1
  };

  constructor() {
    this.synthesis = window.speechSynthesis;
    this.initializeRecognition();
    this.loadVoices();
  }

  private initializeRecognition() {
    // Check for browser support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.setupRecognition();
    } else {
      console.warn('Speech recognition not supported in this browser');
    }
  }

  private setupRecognition() {
    if (!this.recognition) return;

    this.recognition.continuous = this.defaultRecognitionConfig.continuous;
    this.recognition.interimResults = this.defaultRecognitionConfig.interimResults;
    this.recognition.lang = this.defaultRecognitionConfig.language;
    this.recognition.maxAlternatives = this.defaultRecognitionConfig.maxAlternatives;
  }

  private loadVoices() {
    const loadVoicesHandler = () => {
      this.voices = this.synthesis.getVoices();
    };

    // Load voices immediately if available
    loadVoicesHandler();

    // Also listen for the voiceschanged event (some browsers need this)
    this.synthesis.addEventListener('voiceschanged', loadVoicesHandler);
  }

  // Text-to-Speech Methods
  async speak(text: string, config?: Partial<VoiceConfig>): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isSpeaking) {
        this.stopSpeaking();
      }

      const utterance = new SpeechSynthesisUtterance(text);
      const voiceConfig = { ...this.defaultVoiceConfig, ...config };

      // Set voice properties
      utterance.lang = voiceConfig.language;
      utterance.rate = voiceConfig.rate;
      utterance.pitch = voiceConfig.pitch;
      utterance.volume = voiceConfig.volume;

      // Set voice if specified
