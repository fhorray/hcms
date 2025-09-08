import { Editor } from '@tiptap/core';
import React, { useState } from 'react';
import { EmojiPicker } from '../extensions/emoji-picker/picker';

interface EmojiToolbarButtonProps {
  editor: Editor;
}

export const EmojiToolbarButton: React.FC<EmojiToolbarButtonProps> = ({
  editor,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const buttonClass = (active: boolean) =>
    `p-2 rounded-md transition-all duration-200 cursor-pointer ${
      active
        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
    } text-gray-700 dark:text-gray-300`;

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsPickerOpen(!isPickerOpen)}
        className={buttonClass(isPickerOpen)} // Ajustado para usar isPickerOpen
        aria-label="Inserir Emoji"
      >
        😊
      </button>
      {isPickerOpen && (
        <EmojiPicker editor={editor} onClose={() => setIsPickerOpen(false)} />
      )}
    </div>
  );
};
