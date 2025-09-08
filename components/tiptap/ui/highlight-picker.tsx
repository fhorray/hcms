import { Editor } from '@tiptap/core';
import { HighlighterIcon } from 'lucide-react';
import { useState } from 'react';

const highlightColors = [
  { color: 'yellow', class: 'bg-yellow-200' },
  { color: 'red', class: 'bg-red-200/40' },
  { color: 'green', class: 'bg-green-200/40' },
  { color: 'blue', class: 'bg-blue-200/40' },
  { color: 'purple', class: 'bg-purple-200/40' },
];

export const HighlightPicker = ({ editor }: { editor: Editor }) => {
  const [showHighlightColors, setShowHighlightColors] = useState(false);

  const buttonClass = (active: boolean) =>
    `p-1.5 rounded-md transition-all duration-200 cursor-pointer ${
      active
        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
    } text-gray-700 dark:text-gray-300`;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShowHighlightColors(!showHighlightColors)}
        className={buttonClass(editor.isActive('highlight'))}
        aria-label="Highlight"
      >
        <HighlighterIcon size={18} />
      </button>

      {showHighlightColors && (
        <div className="w-[180px] absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-2 grid grid-cols-5 gap-1">
          {highlightColors.map(({ color, class: bgClass }) => (
            <button
              key={color}
              type="button"
              onClick={() => {
                editor.chain().focus().toggleHighlight({ color }).run();
                setShowHighlightColors(false);
              }}
              className={`w-6 h-6 rounded-md cursor-pointer ${bgClass} hover:ring-2 hover:ring-offset-2 hover:ring-gray-400`}
              aria-label={`Highlight ${color}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
