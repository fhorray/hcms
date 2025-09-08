import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { ImageUploaderComponent } from './component';


declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    imageUploader: {
      setImageUploader: () => ReturnType;
    };
  }
}

export const ImageUploader = Node.create({
  name: 'imageUploader',
  group: 'block',
  selectable: true,
  draggable: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      alt: {
        default: null,
      },
      title: {
        default: null,
      },
      width: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.width) {
            return {};
          }
          return {
            width: attributes.width,
          };
        },
      },
      height: {
        default: null,
        renderHTML: attributes => {
          if (!attributes.height) {
            return {};
          }
          return {
            height: attributes.height,
          };
        },
      },
      loading: {
        default: false,
        rendered: false,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="image-uploader"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'image-uploader' })];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageUploaderComponent);
  },

  addCommands() {
    return {
      setImageUploader:
        () =>
          ({ commands }) => {
            return commands.insertContent({
              type: this.name,
            });
          },
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: ({ editor }) => {
        const { selection } = editor.state;
        const node = editor.state.doc.nodeAt(selection.from);
        if (node?.type.name === this.name) {
          return true; // block deletion
        }
        return false;
      },
      Delete: ({ editor }) => {
        const { selection } = editor.state;
        const node = editor.state.doc.nodeAt(selection.from);
        if (node?.type.name === this.name) {
          return true;
        }
        return false;
      },
    };
  },
});

export default ImageUploader;