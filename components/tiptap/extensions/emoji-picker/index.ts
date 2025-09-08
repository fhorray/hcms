import { getAttributes, Node } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { EmojiNodeView } from './component'

export interface EmojiAttributes {
  emoji: string | null
}

export interface EmojiOptions {
  emoji: string | null
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    emoji: {
      setEmoji: (emoji: string) => ReturnType
    }
  }
}

const EmojiExtension = Node.create<EmojiOptions>({
  name: 'emoji',

  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addOptions() {
    return {
      emoji: null,
    }
  },

  addAttributes() {
    return {
      emoji: {
        default: null,
      }
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-emoji]',
        getAttrs: (dom: HTMLElement) => ({
          emoji: dom.getAttribute('data-emoji'),
        }),
      },
    ]
  },

  renderHTML({ node }) {
    return ['span', { 'data-emoji': node.attrs.emoji, class: 'emoji' }, node.attrs.emoji]
  },


  addCommands() {
    return {
      setEmoji:
        (emoji: string) =>
          ({ commands }) => {
            return commands.insertContent({
              type: this.name,
              attrs: { emoji },
            })
          },
    }
  },

  addNodeView() {
    return ReactNodeViewRenderer(EmojiNodeView)
  },
})

export default EmojiExtension