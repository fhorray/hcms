import { Editor } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  FileCode,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Quote,
  Sparkles,
  Strikethrough,
  Table,
  Underline,
} from 'lucide-react';
import React from 'react';
import { AIFeature } from '../constants';
import { useTheme } from '../theme-context';
import ColorPicker from './color-picker';
import { EmojiToolbarButton } from './emoji-picker-button';
import FontStylePicker from './font-style-picker';
import { HighlightPicker } from './highlight-picker';

interface EditorMenuBarProps {
  editor: Editor | null;
  onAIFeatureRequest: (feature: AIFeature) => void;
  useAi?: boolean;
}

const EditorMenuBar: React.FC<EditorMenuBarProps> = ({
  editor,
  onAIFeatureRequest,
  useAi,
}) => {
  const { theme, toggleTheme } = useTheme();

  if (!editor) return null;

  const buttonClass = (active: boolean) =>
    `p-2 rounded-md transition-all duration-200 cursor-pointer ${
      active
        ? 'bg-primary/20 text-primary-foreground'
        : 'hover:bg-muted text-muted-foreground'
    }`;

  return (
    <div className="sticky top-16 z-10 bg-background/80 backdrop-blur-md border-b border-border p-2 rounded-t-lg flex flex-wrap items-center gap-1 shadow-sm ">
      {/* Text Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={buttonClass(editor.isActive('bold'))}
        aria-label="Bold"
      >
        <Bold size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={buttonClass(editor.isActive('italic'))}
        aria-label="Italic"
      >
        <Italic size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={buttonClass(editor.isActive('underline'))}
        aria-label="Underline"
      >
        <Underline size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={buttonClass(editor.isActive('strike'))}
        aria-label="Strikethrough"
      >
        <Strikethrough size={18} />
      </button>

      <EmojiToolbarButton editor={editor} />

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

      {/* Headings */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 1 }))}
        aria-label="Heading 1"
      >
        <Heading1 size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 2 }))}
        aria-label="Heading 2"
      >
        <Heading2 size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={buttonClass(editor.isActive('heading', { level: 3 }))}
        aria-label="Heading 3"
      >
        <Heading3 size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

      {/* Text Alignment */}
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        className={buttonClass(editor.isActive({ textAlign: 'left' }))}
        aria-label="Align Left"
      >
        <AlignLeft size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        className={buttonClass(editor.isActive({ textAlign: 'center' }))}
        aria-label="Align Center"
      >
        <AlignCenter size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        className={buttonClass(editor.isActive({ textAlign: 'right' }))}
        aria-label="Align Right"
      >
        <AlignRight size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        className={buttonClass(editor.isActive({ textAlign: 'justify' }))}
        aria-label="Justify"
      >
        <AlignJustify size={18} />
      </button>

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

      {/* Lists and Formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={buttonClass(editor.isActive('bulletList'))}
        aria-label="Bullet List"
      >
        <List size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={buttonClass(editor.isActive('orderedList'))}
        aria-label="Ordered List"
      >
        <ListOrdered size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={buttonClass(editor.isActive('blockquote'))}
        aria-label="Blockquote"
      >
        <Quote size={18} />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={buttonClass(editor.isActive('codeBlock'))}
        aria-label="Code Block"
      >
        <FileCode size={18} />
      </button>

      <ColorPicker editor={editor} />
      <FontStylePicker editor={editor} />

      <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1"></div>

      {/* Highlighting and Special Features */}
      <HighlightPicker editor={editor} />

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleLink({ href: '' }).run()}
        className={buttonClass(editor.isActive('link'))}
        aria-label="Link"
      >
        <Link size={18} />
      </button>

      <button
        type="button"
        onClick={() => {
          const url = window.prompt('Enter the image URL:');
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        }}
        className={buttonClass(editor.isActive('image'))}
        aria-label="Image"
      >
        <Image size={18} />
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
        className={buttonClass(editor.isActive('table'))}
        aria-label="Table"
      >
        <Table size={18} />
      </button>

      {/* AI Features */}
      {useAi && (
        <>
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-700 mx-1" />
          <button
            type="button"
            onClick={() => onAIFeatureRequest(AIFeature.TEXT_COMPLETION)}
            className="p-2 rounded-md hover:bg-purple-100 dark:hover:bg-purple-900 text-purple-600 dark:text-purple-400 transition-all duration-200 cursor-pointer"
            aria-label="AI Assistance"
          >
            <Sparkles size={18} />
          </button>
        </>
      )}
    </div>
  );
};

export default EditorMenuBar;
