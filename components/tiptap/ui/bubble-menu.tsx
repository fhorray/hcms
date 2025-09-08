import { Editor, BubbleMenu as TiptapBubbleMenu } from '@tiptap/react';
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Italic,
  Link,
  Sparkles,
  Strikethrough,
  Underline,
} from 'lucide-react';
import React from 'react';
import { AIFeature } from '../constants';
import { HighlightPicker } from './highlight-picker';

interface BubbleMenuProps {
  editor: Editor;
  onAIFeatureRequest?: (feature: AIFeature) => void;
  useAi?: boolean;
}

const BubbleMenu: React.FC<BubbleMenuProps> = ({
  editor,
  onAIFeatureRequest,
  useAi = false,
}) => {
  const buttonClass = (active: boolean) =>
    `p-1.5 rounded-md transition-all duration-200 cursor-pointer ${
      active
        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300'
        : 'hover:bg-gray-100 dark:hover:bg-gray-800'
    } text-gray-700 dark:text-gray-300`;

  return (
    <TiptapBubbleMenu
      editor={editor}
      tippyOptions={{
        duration: 200,
        placement: 'top',
        offset: [0, 8],
      }}
      className="w-fit bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-200 dark:border-gray-700 shadow-lg rounded-lg p-1.5 flex items-center gap-1"
      shouldShow={({ editor, view, state, from, to }) => {
        return (
          from !== to &&
          !editor.isActive('codeBlock') &&
          !editor.isActive('table') &&
          !editor.isActive('imageUploader')
        );
      }}
    >
      {/* Basic Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive('bold'))}
        aria-label="Bold"
      >
        <Bold size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive('italic'))}
        aria-label="Italic"
      >
        <Italic size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={buttonClass(editor.isActive('underline'))}
        aria-label="Underline"
      >
        <Underline size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={buttonClass(editor.isActive('strike'))}
        aria-label="Strikethrough"
      >
        <Strikethrough size={16} />
      </button>

      <div className="w-px h-5 bg-gray-300 dark:bg-gray-700"></div>

      {/* Quick Heading */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 1 }))}
        aria-label="Heading 1"
      >
        <Heading1 size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 2 }))}
        aria-label="Heading 2"
      >
        <Heading2 size={16} />
      </button>

      <div className="w-px h-5 bg-gray-300 dark:bg-gray-700"></div>

      {/* Highlight and Link */}
      <HighlightPicker editor={editor} />
      <button
        type="button"
        onClick={() => {
          const previousUrl = editor.getAttributes('link').href;
          const url = window.prompt('Enter URL', previousUrl);

          if (url === null) {
            return;
          }

          if (url === '') {
            editor.chain().focus().extendMarkRange('link').unsetLink().run();
            return;
          }

          editor
            .chain()
            .focus()
            .extendMarkRange('link')
            .setLink({ href: url })
            .run();
        }}
        className={buttonClass(editor.isActive('link'))}
        aria-label="Link"
      >
        <Link size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        className={buttonClass(editor.isActive('code'))}
        aria-label="Inline Code"
      >
        <Code size={16} />
      </button>

      <div className="w-px h-5 bg-gray-300 dark:bg-gray-700"></div>

      {/* Text Alignment */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={buttonClass(editor.isActive({ textAlign: 'left' }))}
        aria-label="Align Left"
      >
        <AlignLeft size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={buttonClass(editor.isActive({ textAlign: 'center' }))}
        aria-label="Align Center"
      >
        <AlignCenter size={16} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={buttonClass(editor.isActive({ textAlign: 'right' }))}
        aria-label="Align Right"
      >
        <AlignRight size={16} />
      </button>

      {/* AI Feature */}
      {onAIFeatureRequest && useAi && (
        <>
          <div className="w-px h-5 bg-gray-300 dark:bg-gray-700"></div>
          <button
            type="button"
            onClick={() => onAIFeatureRequest(AIFeature.TEXT_COMPLETION)}
            className="p-1.5 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-400 transition-all duration-200 cursor-pointer"
            aria-label="AI Assistance"
          >
            <Sparkles size={16} />
          </button>
        </>
      )}
    </TiptapBubbleMenu>
  );
};

export default BubbleMenu;
