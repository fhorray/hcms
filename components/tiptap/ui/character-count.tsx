import React from 'react';
import { Editor } from '@tiptap/react';
import { CharacterCount as CharacterCountType } from '../constants';

interface CharacterCountProps {
  editor: Editor;
}

const CharacterCount: React.FC<CharacterCountProps> = ({ editor }) => {
  const getCharacterCount = (): CharacterCountType => {
    const text = editor.state.doc.textContent;
    return {
      characters: text.length,
      words: text.split(/\s+/).filter((word) => word.length > 0).length,
    };
  };

  const { characters, words } = getCharacterCount();

  return (
    <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-3">
      <span>{characters} characters</span>
      <span>{words} words</span>
    </div>
  );
};

export default CharacterCount;
