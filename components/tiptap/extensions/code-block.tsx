import React, { useState } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { Copy, CheckCircle } from 'lucide-react';

const CodeBlock = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const content = document.querySelector('.code-block-content')?.textContent;
    if (content) {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <NodeViewWrapper className="relative group">
      <pre className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 font-mono text-sm overflow-x-auto">
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-md bg-white/90 dark:bg-gray-700/90 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 transition-colors"
            aria-label="Copy code"
          >
            {copied ? <CheckCircle size={16} className="text-green-500" /> : <Copy size={16} />}
          </button>
        </div>
        <NodeViewContent className="code-block-content" />
      </pre>
    </NodeViewWrapper>
  );
};

export default CodeBlock;