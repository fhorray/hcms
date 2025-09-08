import React from 'react';
import { Editor } from '@tiptap/react';
import { Palette } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ColorPalette } from '../constants';

interface ColorPickerProps {
  editor: Editor | null;
}

const ColorPicker: React.FC<ColorPickerProps> = ({ editor }) => {
  if (!editor) return null;

  const colors = Object.values(ColorPalette);

  const setColor = (color: string) => {
    editor.chain().focus().setColor(color).run();
  };

  const currentColor =
    editor.getAttributes('textStyle')?.color || ColorPalette.BLACK;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200 flex items-center gap-1 cursor-pointer"
          style={{ color: currentColor }}
          aria-label="Text Color"
        >
          <Palette size={18} />
          <div
            className="w-3 h-3 rounded-full border border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: currentColor }}
          ></div>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 p-2 grid grid-cols-6 gap-1">
        {colors.map((color) => (
          <button
            key={color}
            type="button"
            onClick={() => setColor(color)}
            className={`w-6 h-6 rounded-full hover:ring-2 hover:ring-offset-2 hover:ring-gray-400 dark:hover:ring-gray-500 transition-all ${
              currentColor === color
                ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-gray-500'
                : ''
            }`}
            style={{ backgroundColor: color }}
            aria-label={`Color ${color}`}
          ></button>
        ))}
      </PopoverContent>
    </Popover>
  );
};

export default ColorPicker;
