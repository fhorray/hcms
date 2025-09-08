import { Button } from '@/components/ui/button';
import {
  CheckCircleIcon,
  Loader2,
  Sparkles,
  XCircleIcon,
  XIcon,
} from 'lucide-react';
import React, { Dispatch, SetStateAction } from 'react';
import { AIFeature } from '../constants';
import { renderHtmlAsJsx } from '../utils';

interface AIAssistantPanelProps {
  isProcessing: boolean;
  aiSuggestion: string | null;
  onRequestFeature: (feature: AIFeature) => void;
  onAcceptSuggestion: () => void;
  onRejectSuggestion: () => void;
  onOpenChange: Dispatch<SetStateAction<boolean>>;
}

const AIAssistantPanel: React.FC<AIAssistantPanelProps> = ({
  isProcessing,
  aiSuggestion,
  onRequestFeature,
  onAcceptSuggestion,
  onRejectSuggestion,
  onOpenChange,
}) => {
  return (
    <div className="relative bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-lg border border-gray-200 dark:border-gray-700 p-4 mt-4 transition-all duration-300">
      <Button
        type="button"
        variant={'ghost'}
        size={'icon'}
        className="absolute right-2 top-2 z-10 cursor-pointer"
        onClick={() => onOpenChange(false)}
      >
        <XIcon />
      </Button>

      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="text-purple-500 dark:text-purple-400" size={20} />
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          AI Assistant
        </h3>
      </div>

      {isProcessing ? (
        <div className="flex items-center justify-center py-4">
          <Loader2
            className="animate-spin text-purple-500 dark:text-purple-400 mr-2"
            size={20}
          />
          <p className="text-gray-600 dark:text-gray-400">
            Processing your content...
          </p>
        </div>
      ) : aiSuggestion ? (
        <div className="mb-4">
          <div className="prose bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800 rounded-md p-3 mb-3">
            {renderHtmlAsJsx(aiSuggestion)}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onAcceptSuggestion}
              className="flex items-center gap-1 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-md text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors"
            >
              <CheckCircleIcon size={16} />
              <span>Accept</span>
            </button>
            <button
              type="button"
              onClick={onRejectSuggestion}
              className="flex items-center gap-1 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-md text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <XCircleIcon size={16} />
              <span>Reject</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onRequestFeature(AIFeature.TEXT_COMPLETION)}
            className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-700 transition-colors"
          >
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Complete Text
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Suggest completions for your writing
            </span>
          </button>

          <button
            type="button"
            onClick={() => onRequestFeature(AIFeature.GRAMMAR_CHECK)}
            className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-700 transition-colors"
          >
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Check Grammar
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Find and fix grammar issues
            </span>
          </button>

          <button
            type="button"
            onClick={() => onRequestFeature(AIFeature.STYLE_SUGGESTIONS)}
            className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-700 transition-colors"
          >
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Style Suggestions
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Improve your writing style
            </span>
          </button>

          <button
            type="button"
            onClick={() => onRequestFeature(AIFeature.CONTENT_SUMMARY)}
            className="flex flex-col items-center p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-purple-50 dark:hover:bg-purple-900/20 hover:border-purple-200 dark:hover:border-purple-700 transition-colors"
          >
            <span className="text-gray-700 dark:text-gray-300 font-medium">
              Summarize
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Create a summary of your content
            </span>
          </button>
        </div>
      )}
    </div>
  );
};

export default AIAssistantPanel;
