/**
 * JournalInputModal — Text input modal for requires_input quests.
 * minSentences and maxLength come from the Quest Semantic Registry.
 */

import React, { useState } from 'react';
import {
  Overlay, ConfirmBox, ConfirmTitle, ConfirmDesc, ConfirmBtnRow, ActionBtn,
} from './styles';
import { COMPLETION_MODE_SEMANTICS } from './questSemanticRegistry';

const DEFAULTS = COMPLETION_MODE_SEMANTICS.requires_input.validation;

interface Props {
  title: string;
  description: string;
  onSubmit: (text: string) => void;
  onCancel: () => void;
  minSentences?: number;
  maxLength?: number;
}

function countSentences(text: string): number {
  const sentences = text.split(/[.!?…。]+\s*/u).filter(s => s.trim().length > 0);
  return sentences.length;
}

const JournalInputModal: React.FC<Props> = ({ title, description, onSubmit, onCancel, minSentences = DEFAULTS.minSentences, maxLength = DEFAULTS.maxTextLength }) => {
  const [text, setText] = useState('');
  const sentenceCount = countSentences(text);
  const isValid = sentenceCount >= minSentences;

  return (
    <Overlay onClick={onCancel}>
      <ConfirmBox onClick={e => e.stopPropagation()} style={{ maxWidth: '500px', textAlign: 'left' }}>
        <ConfirmTitle style={{ textAlign: 'center' }}>📝 {title}</ConfirmTitle>
        <ConfirmDesc style={{ textAlign: 'center' }}>{description}</ConfirmDesc>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={`Viết ít nhất ${minSentences} câu...`}
          maxLength={maxLength || undefined}
          style={{
            width: '100%',
            minHeight: '120px',
            padding: '0.75rem',
            borderRadius: '10px',
            border: '2px solid #E2E8F0',
            fontSize: '0.9rem',
            lineHeight: '1.6',
            resize: 'vertical',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
        <div style={{
          fontSize: '0.8rem',
          color: isValid ? '#48BB78' : '#E53E3E',
          marginTop: '0.5rem',
          marginBottom: '1rem',
          textAlign: 'right',
        }}>
          {sentenceCount}/{minSentences} câu {isValid ? '✅' : '(cần thêm)'}
        </div>
        <ConfirmBtnRow style={{ justifyContent: 'center' }}>
          <ActionBtn variant="secondary" onClick={onCancel}>Hủy</ActionBtn>
          <ActionBtn
            onClick={() => { if (isValid) onSubmit(text.trim()); }}
            style={{ opacity: isValid ? 1 : 0.5, cursor: isValid ? 'pointer' : 'not-allowed' }}
          >
            ✨ Gửi & Hoàn thành
          </ActionBtn>
        </ConfirmBtnRow>
      </ConfirmBox>
    </Overlay>
  );
};

export default JournalInputModal;
