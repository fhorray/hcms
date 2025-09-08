// extensions/FontSize.ts
import { Mark, mergeAttributes } from '@tiptap/core';

export interface FontSizeOptions {
  types: string[]; // allowed tailwind sizes
  defaultSize: string;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

export const FontSize = Mark.create<FontSizeOptions>({
  name: 'fontSize',

  addOptions() {
    return {
      types: [
        'text-xs', 'text-sm', 'text-base', 'text-lg',
        'text-xl', 'text-2xl', 'text-3xl', 'text-4xl',
      ],
      defaultSize: 'text-base',
    };
  },

  addAttributes() {
    return {
      class: {
        default: this.options.defaultSize,
        parseHTML: (element) => {
          const classAttr = element.getAttribute('class');
          if (!classAttr) return null;

          const matched = classAttr.split(' ').find(cls =>
            this.options.types.includes(cls)
          );

          return matched || this.options.defaultSize;
        },
        renderHTML: (attrs) => {
          return {
            class: attrs.class,
          };
        },
      },
    };
  },

  parseHTML() {
    return [{ tag: 'span' }];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes), 0];
  },

  addCommands() {
    return {
      setFontSize:
        (size: string) =>
          ({ commands }) => {
            return commands.setMark(this.name, { class: size });
          },

      unsetFontSize:
        () =>
          ({ commands }) => {
            return commands.unsetMark(this.name);
          },
    };
  }
});