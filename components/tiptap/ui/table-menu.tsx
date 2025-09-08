import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { Editor } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  ColumnsIcon,
  MoreVertical,
  RowsIcon,
  Trash2,
} from 'lucide-react';
import React, { useState } from 'react';

interface TableMenuProps {
  editor: Editor | null;
}

const TableMenu: React.FC<TableMenuProps> = ({ editor }) => {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  if (!editor || !editor.isActive('table')) return null;

  const buttonClass =
    'p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-all duration-200 flex items-center gap-1 text-sm';
  const dropdownItemClass =
    'w-full px-3 py-1.5 text-left hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center gap-2 text-sm';

  const confirmAction = (action: () => void, message: string) => {
    if (window.confirm(message)) {
      action();
      setActiveDropdown(null);
    }
  };

  return (
    <div className="sticky bottom-4 z-10 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 rounded-lg p-2 shadow-lg max-w-fit mx-auto flex flex-wrap items-center gap-1">
      {/* Column Operations */}
      <Popover
        open={activeDropdown === 'column'}
        onOpenChange={(open) => setActiveDropdown(open ? 'column' : null)}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={buttonClass}
            aria-label="Column Operations"
          >
            <ColumnsIcon size={16} />
            <MoreVertical size={14} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
          align="start"
          side="top"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className={dropdownItemClass}
          >
            <ArrowLeft size={14} /> Insert Left
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className={dropdownItemClass}
          >
            <ArrowRight size={14} /> Insert Right
          </button>

          <Separator />
          <button
            type="button"
            onClick={() =>
              confirmAction(
                () => editor.chain().focus().deleteColumn().run(),
                'Are you sure you want to delete this column?',
              )
            }
            className={`${dropdownItemClass} text-red-600 dark:text-red-400`}
          >
            <Trash2 size={14} /> Delete
          </button>
        </PopoverContent>
      </Popover>

      {/* Row Operations */}
      <Popover
        open={activeDropdown === 'row'}
        onOpenChange={(open) => setActiveDropdown(open ? 'row' : null)}
      >
        <PopoverTrigger asChild>
          <button
            type="button"
            className={buttonClass}
            aria-label="Row Operations"
          >
            <RowsIcon size={16} />
            <MoreVertical size={14} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 min-w-[160px]"
          align="start"
          side="top"
        >
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className={dropdownItemClass}
          >
            <ChevronUp size={14} /> Insert Above
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className={dropdownItemClass}
          >
            <ChevronDown size={14} /> Insert Below
          </button>

          <Separator />
          <button
            type="button"
            onClick={() =>
              confirmAction(
                () => editor.chain().focus().deleteRow().run(),
                'Are you sure you want to delete this row?',
              )
            }
            className={`${dropdownItemClass} text-red-600 dark:text-red-400`}
          >
            <Trash2 size={14} /> Delete
          </button>
        </PopoverContent>
      </Popover>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-700"></div>

      {/* Text Alignment */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={buttonClass}
        aria-label="Align Left"
      >
        <AlignLeft size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={buttonClass}
        aria-label="Align Center"
      >
        <AlignCenter size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={buttonClass}
        aria-label="Align Right"
      >
        <AlignRight size={16} />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={buttonClass}
        aria-label="Justify"
      >
        <AlignJustify size={16} />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-700"></div>

      <button
        type="button"
        onClick={() =>
          confirmAction(
            () => editor.chain().focus().deleteTable().run(),
            'Are you sure you want to delete the entire table?',
          )
        }
        className="p-1.5 rounded-md hover:bg-red-100 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-all duration-200"
        aria-label="Delete Table"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

export default TableMenu;
