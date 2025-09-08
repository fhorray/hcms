import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';
import Color from '@tiptap/extension-color';
import Document from '@tiptap/extension-document';
import FontFamily from '@tiptap/extension-font-family';
import Gapcursor from '@tiptap/extension-gapcursor';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Table } from '@tiptap/extension-table';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import TableRow from '@tiptap/extension-table-row';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyle } from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';
import SearchAndReplace from "@sereneinserenade/tiptap-search-and-replace"
import { Mention } from "./mention"
import EmojiExtension from "./emoji-picker"
import {
  ReactNodeViewRenderer
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageResize from 'tiptap-extension-resize-image';
import CodeBlock from './code-block';
import { FontSize } from './fontsize';
import { ImageUploader } from './image-uploader';


//Lowlight
import css from 'highlight.js/lib/languages/css';
import js from 'highlight.js/lib/languages/javascript';
import ts from 'highlight.js/lib/languages/typescript';
import html from 'highlight.js/lib/languages/xml';
import { all, createLowlight } from 'lowlight';

const lowlight = createLowlight(all);

lowlight.register('html', html);
lowlight.register('css', css);
lowlight.register('js', js);
lowlight.register('ts', ts);

export const extensions = ({ placeholder }: { placeholder?: string }) => {
  return ([
    Placeholder.configure({
      emptyEditorClass: 'is-editor-empty',
      placeholder: placeholder ?? 'Write something or type "/" to insert a block...',
    }),
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      codeBlock: false,
    }),
    CodeBlockLowlight.extend({
      addNodeView: () => ReactNodeViewRenderer(CodeBlock),
    }).configure({ lowlight }),
    Underline,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    // Mention,
    EmojiExtension,
    ImageResize.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: 'rounded-lg max-w-full',
      },
    }),
    ImageUploader,
    SearchAndReplace,
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'text-blue-600 dark:text-blue-400 underline',
      },
    }),
    TextStyle,
    FontFamily,
    CharacterCount,
    FontSize.configure({
      types: ['text-xs', 'text-sm', 'text-base', 'text-lg', 'text-xl'],
      defaultSize: 'text-base',
    }),
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'border-collapse table-auto w-full',
      },
    }),
    TableRow.configure({
      HTMLAttributes: {
        class: 'border dark:border-gray-700',
      },
    }),
    TableCell.configure({
      HTMLAttributes: {
        class: 'border dark:border-gray-700 p-2',
      },
    }),
    TableHeader.configure({
      HTMLAttributes: {
        class:
          'border dark:border-gray-700 p-2 bg-gray-100 dark:bg-gray-800 font-semibold',
      },
    }),
  ])
}