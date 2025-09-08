import { Editor } from '@tiptap/react';
import { useCallback } from 'react';
import { EditorState, FontFamily, FontSize, HeadingLevel, TextAlignOption } from '../constants';

export const useEditorState = (editor: Editor | null): EditorState => {
  const getCurrentEditorState = useCallback((): EditorState => {
    if (!editor) {
      return {
        isBold: false,
        isItalic: false,
        isUnderline: false,
        isStrike: false,
        isCode: false,
        isHighlighted: false,
        headingLevel: null,
        textAlign: TextAlignOption.LEFT,
        textColor: '#000000',
        fontFamily: FontFamily.ARIAL,
        fontSize: FontSize['16px'],
        isLink: false,
        isImage: false,
        isTable: false,
        isBulletList: false,
        isOrderedList: false,
        isCodeBlock: false,
        isBlockquote: false,
      }
    }

    // Determine heading level
    let headingLevel: HeadingLevel | null = null;
    if (editor.isActive('heading', { level: 1 })) headingLevel = HeadingLevel.H1;
    else if (editor.isActive('heading', { level: 2 })) headingLevel = HeadingLevel.H2;
    else if (editor.isActive('heading', { level: 3 })) headingLevel = HeadingLevel.H3;
    else if (editor.isActive('heading', { level: 4 })) headingLevel = HeadingLevel.H4;
    else if (editor.isActive('heading', { level: 5 })) headingLevel = HeadingLevel.H5;
    else if (editor.isActive('heading', { level: 6 })) headingLevel = HeadingLevel.H6;

    // Determine text alignment
    let textAlign = TextAlignOption.LEFT;
    if (editor.isActive({ textAlign: 'center' })) textAlign = TextAlignOption.CENTER;
    else if (editor.isActive({ textAlign: 'right' })) textAlign = TextAlignOption.RIGHT;
    else if (editor.isActive({ textAlign: 'justify' })) textAlign = TextAlignOption.JUSTIFY;

    // Get current text color
    const textColor = editor.getAttributes('textStyle')?.color || '#000000';

    // Other states
    return {
      isBold: editor.isActive('bold'),
      isItalic: editor.isActive('italic'),
      isUnderline: editor.isActive('underline'),
      isStrike: editor.isActive('strike'),
      isCode: editor.isActive('code'),
      isHighlighted: editor.isActive('highlight'),
      headingLevel,
      textAlign,
      textColor,
      fontFamily: FontFamily.ARIAL,
      fontSize: FontSize['16px'],
      isLink: editor.isActive('link'),
      isImage: editor.isActive('image'),
      isTable: editor.isActive('table'),
      isBulletList: editor.isActive('bulletList'),
      isOrderedList: editor.isActive('orderedList'),
      isCodeBlock: editor.isActive('codeBlock'),
      isBlockquote: editor.isActive('blockquote'),
    };
  }, [editor]);

  return getCurrentEditorState();
};