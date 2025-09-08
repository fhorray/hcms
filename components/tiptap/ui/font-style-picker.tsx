import React from 'react';
import { Editor } from '@tiptap/react';
import { Type } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FontFamily, FontSize } from '../constants';

interface FontStylePickerProps {
  editor: Editor | null;
}

const FontStylePicker: React.FC<FontStylePickerProps> = ({ editor }) => {
  if (!editor) return null;

  const fontFamilies = Object.entries(FontFamily).map(([key, value]) => ({
    name: key.charAt(0) + key.slice(1).toLowerCase(),
    value,
  }));

  const fontSizes = Object.entries(FontSize).map(([key, value]) => ({
    name: key,
    value,
  }));

  const setFontFamily = (fontFamily: string) => {
    editor.chain().focus().setFontFamily(fontFamily).run();
  };

  const setFontSize = (fontSize: string) => {
    editor.chain().focus().setFontSize(`text-${fontSize}`).run();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200 cursor-pointer"
          aria-label="Font Styles"
        >
          <Type size={18} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-48">
        <DropdownMenuLabel>Font Family</DropdownMenuLabel>
        <DropdownMenuGroup>
          {fontFamilies.map(({ name, value }) => (
            <DropdownMenuItem
              key={value}
              onClick={() => setFontFamily(value)}
              className={`font-${value} cursor-pointer`}
            >
              {name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Font Size</DropdownMenuLabel>
        <DropdownMenuGroup>
          <div className="grid grid-cols-3 gap-1 p-1">
            {fontSizes.map(({ name, value }) => (
              <DropdownMenuItem
                key={value}
                onClick={() => setFontSize(value)}
                className="text-center text-sm cursor-pointer"
              >
                {name}
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default FontStylePicker;
