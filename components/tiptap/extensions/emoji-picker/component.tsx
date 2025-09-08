import { NodeViewProps } from '@tiptap/core';
import { NodeViewWrapper } from '@tiptap/react';
import React from 'react';
import { EmojiAttributes } from './index';

export const EmojiNodeView: React.FC<NodeViewProps> = ({ node, editor }) => {
  // Casting para EmojiAttributes
  const attrs = node.attrs as EmojiAttributes;

  return (
    <NodeViewWrapper
      as="span"
      className="emoji-inline"
      data-emoji={attrs.emoji}
    >
      {attrs.emoji}
    </NodeViewWrapper>
  );
};
