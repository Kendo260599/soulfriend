/**
 * Text-to-Speech Service
 * Uses Web Speech API to provide pronunciation for vocabulary items
 */

type TTSOptions = {
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
};

class TextToSpeechService {
  private synth: SpeechSynthesis;
  private isSpeaking: boolean = false;

  constructor() {
    this.synth = window.speechSynthesis;
  }

  /**
   * Check if browser supports Web Speech API
   */
  isSupported(): boolean {
    return !!this.synth;
  }

  /**
   * Speak text using Web Speech API
   */
  speak(text: string, options: TTSOptions = {}): void {
    if (!this.isSupported()) {
      options.onError?.('Text-to-Speech not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Configure speech parameters
    utterance.rate = options.rate || 0.9; // Slightly slower for clarity
    utterance.pitch = options.pitch || 1.0;
    utterance.volume = options.volume || 1.0;
    utterance.lang = options.language || 'en-US';

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
      options.onError?.(`Speech error: ${event.error}`);
    };

    // Speak the text
    this.synth.speak(utterance);
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
   * Get available voices
   */
  getVoices(): SpeechSynthesisVoice[] {
    return this.synth.getVoices();
  }

  /**
   * Set voice
   */
  setVoice(voiceIndex: number): void {
    const voices = this.getVoices();
    if (voices[voiceIndex]) {
      // Store for future use (would need utterance to apply)
      console.log(`Voice set to: ${voices[voiceIndex].name}`);
    }
  }
}

// Create singleton instance
const ttsService = new TextToSpeechService();

export default ttsService;
