import { Node, mergeAttributes } from '@tiptap/core';
import { ReactRenderer } from '@tiptap/react';
import { PluginKey } from '@tiptap/pm/state';
import tippy from 'tippy.js';
import { MentionUser } from '../constants';
import Suggestion from '@tiptap/suggestion';
import MentionList from '../ui/mention-list';

export const MentionPluginKey = new PluginKey('mention');

export const Mention = Node.create({
  name: 'mention',
  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: element => element.getAttribute('data-id'),
        renderHTML: attributes => {
          if (!attributes.id) {
            return {};
          }

          return {
            'data-id': attributes.id,
          };
        },
      },
      label: {
        default: null,
        parseHTML: element => element.getAttribute('data-label'),
        renderHTML: attributes => {
          if (!attributes.label) {
            return {};
          }

          return {
            'data-label': attributes.label,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-mention]',
      },
    ];
  },

  renderHTML({ node, HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        { 'data-mention': '' },
        HTMLAttributes,
        { class: 'mention' }
      ),
      `@${node.attrs.label}`,
    ];
  },

  renderText({ node }) {
    return `@${node.attrs.label}`;
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        char: '@',
        items: async ({ query }) => {
          // This would typically fetch from your backend
          const dummyUsers: MentionUser[] = [
            { id: '1', name: 'John Doe', email: 'john@example.com' },
            { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
            { id: '3', name: 'Bob Johnson', email: 'bob@example.com' },
          ];

          return dummyUsers.filter(user =>
            user.name.toLowerCase().includes(query.toLowerCase())
          );
        },
        command: ({ editor, range, props }) => {
          const nodeAfter = editor.view.state.selection.$from.nodeAfter;
          const overrideSpace = nodeAfter?.text?.startsWith(' ');

          if (overrideSpace) {
            range.to += 1;
          }

          editor
            .chain()
            .focus()
            .insertContentAt(range, [
              {
                type: 'mention',
                attrs: {
                  id: props.id,
                  label: props.name,
                },
              },
              {
                type: 'text',
                text: ' ',
              },
            ])
            .run();
        },
        render: () => {
          let component: ReactRenderer | null = null;
          let popup: any | null = null;

          return {
            onStart: props => {
              component = new ReactRenderer(MentionList, {
                props,
                editor: props.editor,
              });

              popup = tippy(document.body, {
                getReferenceClientRect: () => props.clientRect?.() || new DOMRect(),
                appendTo: () => document.body,
                content: component.element,
                showOnCreate: true,
                interactive: true,
                trigger: 'manual',
                placement: 'bottom-start',
              });
            },
            onUpdate: props => {
              component?.updateProps(props);

              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            },
            onKeyDown: props => {
              if (props.event.key === 'Escape') {
                popup[0].hide();
                return true;
              }

              return (component?.ref as any)?.onKeyDown?.(props.event) || false;
            },
            onExit: () => {
              popup[0]?.destroy();
              component?.destroy();
            },
          };
        },
      }),
    ];
  },
});

export default Mention;