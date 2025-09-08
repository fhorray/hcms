import { cn } from '@/lib/utils';
import { Editor, FloatingMenu as TiptapFloatingMenu } from '@tiptap/react';
import {
  BrainIcon,
  CodeIcon,
  FileSearchIcon,
  Heading1Icon,
  Heading2Icon,
  Heading3Icon,
  Heading4Icon,
  ImageIcon,
  ImageUpIcon,
  ListIcon,
  ListOrderedIcon,
  MessageSquareText,
  QuoteIcon,
  SparklesIcon,
  TableIcon,
  Wand2Icon,
} from 'lucide-react';
import React from 'react';
import { AIFeature } from '../constants';
import { ImageDialog } from './image-dialog';

interface FloatingMenuProps {
  editor: Editor;
  onAIFeatureRequest?: (feature: AIFeature) => void;
  useAi?: boolean;
}

const FloatingMenu: React.FC<FloatingMenuProps> = ({
  editor,
  onAIFeatureRequest,
  useAi,
}) => {
  const buttonClass =
    'flex items-center gap-2 px-3 py-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 text-gray-700 dark:text-gray-300 cursor-pointer';
  const sectionClass =
    'border-b border-gray-200 dark:border-gray-700 pb-1 mb-1 last:border-0 last:pb-0 last:mb-0';

  return (
    <TiptapFloatingMenu
      editor={editor}
      tippyOptions={{
        duration: 200,
        placement: 'left-start',
        offset: [0, 8],
      }}
      className="fixed bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-1.5 flex flex-col gap-1 min-w-[200px] max-h-[80vh] overflow-y-auto"
      shouldShow={({ state, editor }) => {
        const { $from } = state.selection;
        const currentLineText = $from.nodeBefore?.textContent || '';

        const isStartOfParagraph =
          $from.parent.type.name === 'paragraph' &&
          $from.parent.textContent.length <= 1;
        const hasSlashPrefix = currentLineText === '/';

        if (isStartOfParagraph && hasSlashPrefix) {
          editor.commands.deleteRange({
            from: $from.pos - 1,
            to: $from.pos,
          });
          return true;
        }

        return false;
      }}
    >
      {/* Basic Blocks */}
      <div className={cn('flex w-full', sectionClass)}>
        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          className={cn(
            'w-full flex items-center justify-center cursor-pointer h-10 p-1',
            buttonClass,
          )}
        >
          <Heading1Icon size={16} />
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          className={cn(
            'w-full flex items-center justify-center cursor-pointer h-10 p-1',
            buttonClass,
          )}
        >
          <Heading2Icon size={16} />
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          className={cn(
            'w-full flex items-center justify-center cursor-pointer h-10 p-1',
            buttonClass,
          )}
        >
          <Heading3Icon size={16} />
        </button>

        <button
          type="button"
          onClick={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
          className={cn(
            'w-full flex items-center justify-center cursor-pointer h-10 p-1',
            buttonClass,
          )}
        >
          <Heading4Icon size={16} />
        </button>
      </div>

      {/* Lists and Quotes */}
      <div className={cn('flex w-full', sectionClass)}>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'w-full flex items-center justify-center cursor-pointer h-10 p-1',
            buttonClass,
          )}
        >
          <ListIcon size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            'w-full flex items-center justify-center cursor-pointer h-10 p-1',
            buttonClass,
          )}
        >
          <ListOrderedIcon size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            'w-full flex items-center justify-center cursor-pointer h-10 p-1',
            buttonClass,
          )}
        >
          <QuoteIcon size={16} />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn(
            'w-full flex items-center justify-center cursor-pointer h-10 p-1',
            buttonClass,
          )}
        >
          <CodeIcon size={16} />
        </button>
      </div>

      {/*  Media */}
      <div className={cn('flex w-full', sectionClass)}>
        <ImageDialog editor={editor}>
          <button
            type="button"
            className={cn(
              'w-full flex items-center justify-center cursor-pointer h-10 p-1',
              buttonClass,
            )}
          >
            <ImageIcon size={16} />
          </button>
        </ImageDialog>

        <button
          type="button"
          onClick={() => editor.chain().focus().setImageUploader().run()}
          className={cn(
            'w-full flex items-center justify-center cursor-pointer h-10 p-1',
            buttonClass,
          )}
        >
          <ImageUpIcon size={16} />
        </button>

        <button
          type="button"
          onClick={() =>
            editor
              .chain()
              .focus()
              .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
              .run()
          }
          className={cn(
            'w-full flex items-center justify-center cursor-pointer h-10 p-1',
            buttonClass,
          )}
        >
          <TableIcon size={16} />
        </button>
      </div>

      {/* AI Features */}
      {onAIFeatureRequest && useAi && (
        <div className={sectionClass}>
          <button
            type="button"
            onClick={() => onAIFeatureRequest(AIFeature.TEXT_COMPLETION)}
            className={cn('w-full', buttonClass)}
          >
            <SparklesIcon size={16} /> <span>Complete Text</span>
          </button>

          <button
            type="button"
            onClick={() => onAIFeatureRequest(AIFeature.GRAMMAR_CHECK)}
            className={cn('w-full', buttonClass)}
          >
            <BrainIcon size={16} /> <span>Check Grammar</span>
          </button>

          <button
            type="button"
            onClick={() => onAIFeatureRequest(AIFeature.STYLE_SUGGESTIONS)}
            className={cn('w-full', buttonClass)}
          >
            <Wand2Icon size={16} /> <span>Style Suggestions</span>
          </button>

          <button
            type="button"
            onClick={() => onAIFeatureRequest(AIFeature.CONTENT_SUMMARY)}
            className={cn('w-full', buttonClass)}
          >
            <FileSearchIcon size={16} /> <span>Summarize</span>
          </button>

          <button
            type="button"
            onClick={() => onAIFeatureRequest(AIFeature.CODE_SUGGESTIONS)}
            className={cn('w-full', buttonClass)}
          >
            <MessageSquareText size={16} /> <span>Code Suggestions</span>
          </button>
        </div>
      )}
    </TiptapFloatingMenu>
  );
};

export default FloatingMenu;
