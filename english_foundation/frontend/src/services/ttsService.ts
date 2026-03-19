/**
 * Text-to-Speech Service
 * Uses Web Speech API to provide pronunciation for vocabulary items
 * Supports voice selection, rate/pitch customization, multi-language
 */

type TTSOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
  voice?: SpeechSynthesisVoice;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
};

type VoicePreference = {
  language: string;
  voiceIndex: number;
  rate: number;
  pitch: number;
};

class TextToSpeechService {
  private synth: SpeechSynthesis;
  private isSpeaking: boolean = false;
  private selectedVoiceIndex: number = 0;
  private voicePreferences: Map<string, VoicePreference> = new Map();
  private lastChangeTime: number = 0;

  constructor() {
    this.synth = window.speechSynthesis;
    this.loadVoicePreferences();
    
    // Populate voices when ready
    if (this.synth) {
      this.synth.onvoiceschanged = () => {
        console.log(`TTS: ${this.getVoices().length} voices available`);
      };
    }
  }

  private loadVoicePreferences(): void {
    try {
      const saved = localStorage.getItem('ttsPreferences');
      if (saved) {
        const prefs = JSON.parse(saved);
        this.voicePreferences = new Map(Object.entries(prefs));
        this.selectedVoiceIndex = localStorage.getItem('selectedVoiceIndex') 
          ? parseInt(localStorage.getItem('selectedVoiceIndex')!) 
          : 0;
      }
    } catch {
      console.warn('TTS: Failed to load voice preferences');
    }
  }

  private saveVoicePreferences(): void {
    try {
      localStorage.setItem('selectedVoiceIndex', this.selectedVoiceIndex.toString());
      const prefs = Object.fromEntries(this.voicePreferences);
      localStorage.setItem('ttsPreferences', JSON.stringify(prefs));
    } catch {
      console.warn('TTS: Failed to save voice preferences');
    }
  }

  /**
   * Check if browser supports Web Speech API
   */
  isSupported(): boolean {
    return !!this.synth;
  }

  /**
   * Speak text using Web Speech API with voice preference
   */
  speak(text: string, options: TTSOptions = {}): void {
    if (!this.isSupported()) {
      options.onError?.('Text-to-Speech not supported in this browser');
      return;
    }

    // Prevent rapid consecutive calls
    const now = Date.now();
    if (now - this.lastChangeTime < 100) {
      return;
    }
    this.lastChangeTime = now;

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Use provided voice or get preferred voice for language
    const lang = options.language || 'en-US';
    if (options.voice) {
      utterance.voice = options.voice;
    } else {
      const preferredVoice = this.getPreferredVoice(lang);
      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }
    }

    // Configure speech parameters
    utterance.rate = options.rate || 0.9; // Slightly slower for clarity
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;
    utterance.lang = lang;

    // Setup event handlers
    utterance.onstart = () => {
      this.isSpeaking = true;
      options.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeaking = false;
      options.onEnd?.();
    };

    utterance.onerror = (event) => {
      this.isSpeaking = false;
      console.warn(`TTS Error: ${event.error}`, event);
      options.onError?.(`Speech error: ${event.error}`);
    };

    // Speak the text
    try {
      this.synth.speak(utterance);
    } catch (error) {
      console.error('TTS speak error:', error);
      options.onError?.(`Failed to speak: ${String(error)}`);
    }
  }

  /**
   * Speak a word with proper pronunciation rate
   */
  speakWord(word: string, onStart?: () => void, onEnd?: () => void): void {
    this.speak(word, {
      rate: 0.8, // Slower for individual words
      language: 'en-US',
      onStart,
      onEnd,
    });
  }

  /**
   * Speak a phrase with normal speed
   */
  speakPhrase(phrase: string, onStart?: () => void, onEnd?: () => void): void {
    this.speak(phrase, {
      rate: 0.9, // Slightly slower but more natural than word
      language: 'en-US',
      onStart,
      onEnd,
    });
  }

  /**
   * Stop speaking
   */
  stop(): void {
    if (this.synth) {
      this.synth.cancel();
      this.isSpeaking = false;
    }
  }

  /**
   * Check if currently speaking
   */
  isSpeakingNow(): boolean {
    return this.isSpeaking || this.synth.speaking;
  }

  /**
   * Get available voices by language
   */
  getVoicesByLanguage(lang: string = 'en-US'): SpeechSynthesisVoice[] {
    const allVoices = this.getVoices();
    return allVoices.filter(voice => 
      voice.lang.startsWith(lang.substring(0, 2))
    );
  }

  /**
   * Set preferred voice for language
   */
  setVoiceForLanguage(lang: string, voiceIndex: number): void {
    const voices = this.getVoicesByLanguage(lang);
    if (voiceIndex >= 0 && voiceIndex < voices.length) {
      this.voicePreferences.set(lang, {
        language: lang,
        voiceIndex,
        rate: 0.9,
        pitch: 1.0,
      });
      this.saveVoicePreferences();
      console.log(`TTS: Voice set for ${lang} (${voices[voiceIndex].name})`);
    }
  }

  /**
   * Get preferred voice for language
   */
  getPreferredVoice(lang: string = 'en-US'): SpeechSynthesisVoice | undefined {
    const voices = this.getVoicesByLanguage(lang);
    if (voices.length === 0) return undefined;
    
    const pref = this.voicePreferences.get(lang);
    if (pref && pref.voiceIndex < voices.length) {
      return voices[pref.voiceIndex];
    }
    
    // Default to first female voice if available
    const female = voices.find(v => v.name.includes('Female') || v.name.includes('female'));
    return female || voices[0];
  }

  /**
   * Get all available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  /**
   * Get current voice configuration
   */
  getVoiceConfig(lang: string = 'en-US'): { voiceIndex: number; rate: number; pitch: number } {
    const voices = this.getVoicesByLanguage(lang);
    const pref = this.voicePreferences.get(lang);
    
    return {
      voiceIndex: pref?.voiceIndex ?? 0,
      rate: pref?.rate ?? 0.9,
      pitch: pref?.pitch ?? 1.0,
    };
  }

  /**
   * Record (log) pronunciation attempt for analytics
   */
  recordPronunciation(word: string, success: boolean): void {
    try {
      const history = JSON.parse(localStorage.getItem('pronunciationHistory') || '[]');
      history.push({
        word,
        success,
        timestamp: Date.now(),
      });
      // Keep only last 100 entries
      if (history.length > 100) {
        history.shift();
      }
      localStorage.setItem('pronunciationHistory', JSON.stringify(history));
    } catch {
      console.warn('TTS: Failed to record pronunciation');
    }
  }
}

// Create singleton instance
const ttsService = new TextToSpeechService();

export default ttsService;
