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
      if (voiceConfig.voice) {
        utterance.voice = voiceConfig.voice;
      } else {
        // Find a suitable voice for the language
        const suitableVoice = this.findVoiceByLanguage(voiceConfig.language);
        if (suitableVoice) {
          utterance.voice = suitableVoice;
        }
      }

      // Set up event handlers
      utterance.onstart = () => {
        this.isSpeaking = true;
      };

      utterance.onend = () => {
        this.isSpeaking = false;
        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeaking = false;
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      // Speak the text
      this.synthesis.speak(utterance);
    });
  }

  stopSpeaking(): void {
    if (this.synthesis.speaking) {
      this.synthesis.cancel();
      this.isSpeaking = false;
    }
  }

  pauseSpeaking(): void {
    if (this.synthesis.speaking && !this.synthesis.paused) {
      this.synthesis.pause();
    }
  }

  resumeSpeaking(): void {
    if (this.synthesis.paused) {
      this.synthesis.resume();
    }
  }

  // Speech-to-Text Methods
  async startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onError?: (error: string) => void,
    config?: Partial<SpeechRecognitionConfig>
  ): Promise<void> {
    if (!this.recognition) {
      throw new Error('Speech recognition not supported');
    }

    if (this.isListening) {
      this.stopListening();
    }

    const recognitionConfig = { ...this.defaultRecognitionConfig, ...config };

    // Update recognition settings
    this.recognition.continuous = recognitionConfig.continuous;
    this.recognition.interimResults = recognitionConfig.interimResults;
    this.recognition.lang = recognitionConfig.language;
    this.recognition.maxAlternatives = recognitionConfig.maxAlternatives;

    // Set up event handlers
    this.recognition.onstart = () => {
      this.isListening = true;
    };

    this.recognition.onresult = (event: any) => {
      let transcript = '';
      let isFinal = false;

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        transcript += result[0].transcript;
        if (result.isFinal) {
          isFinal = true;
        }
      }

      onResult(transcript, isFinal);
    };

    this.recognition.onerror = (event: any) => {
      this.isListening = false;
      if (onError) {
        onError(`Speech recognition error: ${event.error}`);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    // Start recognition
    this.recognition.start();
  }

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  // Utility Methods
  getAvailableVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }

  findVoiceByLanguage(language: string): SpeechSynthesisVoice | null {
    return this.voices.find(voice => voice.lang.startsWith(language)) || null;
  }

  findVoiceByName(name: string): SpeechSynthesisVoice | null {
    return this.voices.find(voice => voice.name === name) || null;
  }

  getVoicesByLanguage(language: string): SpeechSynthesisVoice[] {
    return this.voices.filter(voice => voice.lang.startsWith(language));
  }

  // Status Methods
  get isCurrentlyListening(): boolean {
    return this.isListening;
  }

  get isCurrentlySpeaking(): boolean {
    return this.isSpeaking;
  }

  get isSupported(): boolean {
    return !!(this.synthesis && this.recognition);
  }

  get isSpeechRecognitionSupported(): boolean {
    return !!this.recognition;
  }

  get isSpeechSynthesisSupported(): boolean {
    return !!this.synthesis;
  }

  // Configuration Methods
  updateVoiceConfig(config: Partial<VoiceConfig>): void {
    this.defaultVoiceConfig = { ...this.defaultVoiceConfig, ...config };
  }

  updateRecognitionConfig(config: Partial<SpeechRecognitionConfig>): void {
    this.defaultRecognitionConfig = { ...this.defaultRecognitionConfig, ...config };
    this.setupRecognition();
  }

  // Advanced Features
  async speakWithSSML(ssml: string, config?: Partial<VoiceConfig>): Promise<void> {
    // For browsers that support SSML, we would parse and apply the markup
    // For now, we'll strip SSML tags and speak the text
    const text = this.stripSSMLTags(ssml);
    return this.speak(text, config);
  }

  private stripSSMLTags(ssml: string): string {
    return ssml.replace(/<[^>]*>/g, '');
  }

  // Voice Activity Detection
  async detectVoiceActivity(
    onActivityStart: () => void,
    onActivityEnd: () => void,
    threshold: number = 0.01
  ): Promise<void> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      microphone.connect(analyser);
      analyser.fftSize = 512;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let isActive = false;
      
      const checkActivity = () => {
        analyser.getByteFrequencyData(dataArray);
        
        const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength;
        const normalizedLevel = average / 255;
        
        if (normalizedLevel > threshold && !isActive) {
          isActive = true;
          onActivityStart();
        } else if (normalizedLevel <= threshold && isActive) {
          isActive = false;
          onActivityEnd();
        }
        
        requestAnimationFrame(checkActivity);
      };
      
      checkActivity();
    } catch (error) {
      console.error('Error setting up voice activity detection:', error);
    }
  }
}

// Singleton instance
export const voiceManager = new VoiceManager();
