import React, { useState } from 'react';
import ttsService from '../services/ttsService';
import '../styles/pronunciation.css';

interface PronunciationButtonProps {
  word: string;
  text?: string; // Optional full text to speak instead of just word
  variant?: 'word' | 'phrase' | 'sentence'; // How to speak it
  disabled?: boolean;
  className?: string;
  label?: string;
  showLabel?: boolean;
}

/**
 * PronunciationButton Component
 * Provides audio playback of English pronunciation using TTS
 * Integrates with vocabulary cards and lesson screens
 */
export const PronunciationButton: React.FC<PronunciationButtonProps> = ({
  word,
  text,
  variant = 'word',
  disabled = false,
  className = '',
  label,
  showLabel = true,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = () => {
    if (disabled || isPlaying || !ttsService.isSupported()) {
      return;
    }

    setError(null);
    const textToSpeak = text || word;

    try {
      if (variant === 'word') {
        ttsService.speakWord(
          textToSpeak,
          () => setIsPlaying(true),
          () => {
            setIsPlaying(false);
            ttsService.recordPronunciation(word, true);
          }
        );
      } else if (variant === 'phrase') {
        ttsService.speakPhrase(
          textToSpeak,
          () => setIsPlaying(true),
          () => {
            setIsPlaying(false);
            ttsService.recordPronunciation(word, true);
          }
        );
      } else {
        // sentence mode - normal speed
        ttsService.speak(
          textToSpeak,
          {
            rate: 0.95,
            language: 'en-US',
            onStart: () => setIsPlaying(true),
            onEnd: () => {
              setIsPlaying(false);
              ttsService.recordPronunciation(word, true);
            },
            onError: (err) => {
              setIsPlaying(false);
              setError(err);
              ttsService.recordPronunciation(word, false);
            },
          }
        );
      }
    } catch (err) {
      setIsPlaying(false);
      setError(`Error: ${String(err)}`);
      ttsService.recordPronunciation(word, false);
    }
  };

  if (!ttsService.isSupported()) {
    return null;
  }

  const buttonLabel = label || (variant === 'word' ? `📢 ${word}` : '🔊 Hear it');

  return (
    <div className={`pronunciation-button-container ${className}`}>
      <button
        onClick={handleClick}
        disabled={disabled || isPlaying}
        className={`pronunciation-btn ${isPlaying ? 'playing' : ''}`}
        title={`Click to hear pronunciation of "${word}"`}
        aria-label={`Pronounce: ${word}`}
      >
        <span className="speaker-icon">
          {isPlaying ? '🔊' : '🔉'}
        </span>
        {showLabel && <span className="btn-label">{buttonLabel}</span>}
      </button>
      {error && <div className="pronunciation-error">{error}</div>}
    </div>
  );
};

/**
 * VocabularyPronunciation Component
 * Full pronunciation UI for vocabulary items
 * Shows IPA, word pronunciation, and example sentence playback
 */
interface VocabularyPronunciationProps {
  word: string;
  ipa?: string;
  collocation?: string;
  exampleSentence?: string;
  meaning?: string;
}

export const VocabularyPronunciation: React.FC<VocabularyPronunciationProps> = ({
  word,
  ipa,
  collocation,
  exampleSentence,
  meaning,
}) => {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleSpeakWord = () => {
    setIsSpeaking(true);
    ttsService.speakWord(word, undefined, () => setIsSpeaking(false));
  };

  const handleSpeakExample = () => {
    if (!exampleSentence) return;
    setIsSpeaking(true);
    ttsService.speak(exampleSentence, {
      rate: 0.9,
      onEnd: () => setIsSpeaking(false),
    });
  };

  return (
    <div className="vocabulary-pronunciation">
      <div className="pronunciation-header">
        <h3 className="word">{word}</h3>
        {ipa && <span className="ipa">/{ipa}/</span>}
      </div>

      <div className="pronunciation-controls">
        <button
          onClick={handleSpeakWord}
          disabled={isSpeaking}
          className="pronounce-word-btn"
          title="Click to hear word pronunciation"
        >
          <span className="icon">🎤</span>
          <span className="text">Pronounce</span>
        </button>

        {exampleSentence && (
          <button
            onClick={handleSpeakExample}
            disabled={isSpeaking}
            className="pronounce-example-btn"
            title="Click to hear example sentence"
          >
            <span className="icon">📢</span>
            <span className="text">Example</span>
          </button>
        )}
      </div>

      {exampleSentence && (
        <div className="example-section">
          <p className="example-label">Example:</p>
          <p className="example-text">{exampleSentence}</p>
        </div>
      )}

      {meaning && (
        <div className="meaning-section">
          <p className="meaning-label">Meaning:</p>
          <p className="meaning-text">{meaning}</p>
        </div>
      )}

      {collocation && (
        <div className="collocation-section">
          <p className="collocation-label">Collocation:</p>
          <p className="collocation-text">{collocation}</p>
        </div>
      )}
    </div>
  );
};

export default PronunciationButton;
