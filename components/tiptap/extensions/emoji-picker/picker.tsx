import { Editor } from '@tiptap/core';
import Picker from '@emoji-mart/react';
import React from 'react';

// Interface para o objeto retornado pelo Picker
interface EmojiData {
  id: string;
  native: string;
  unified: string;
  [key: string]: any;
}

interface EmojiPickerProps {
  editor: Editor;
  onClose: () => void;
}

export const EmojiPicker: React.FC<EmojiPickerProps> = ({
  editor,
  onClose,
}) => {
  const handleEmojiSelect = (emoji: EmojiData) => {
    console.log(emoji);
    if (emoji.native) {
      editor.chain().focus().setEmoji(emoji.native).run();
      onClose();
    }
  };

  return (
    <div style={{ position: 'absolute', zIndex: 1000, top: '40px', left: 0 }}>
      <Picker onEmojiSelect={handleEmojiSelect} />
    </div>
  );
};
