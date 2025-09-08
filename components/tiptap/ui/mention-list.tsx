import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { MentionUser } from '../constants';

interface MentionListProps {
  items: MentionUser[];
  command: (user: MentionUser) => void;
}

const MentionList = forwardRef<
  { onKeyDown: (event: KeyboardEvent) => boolean },
  MentionListProps
>(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index: number) => {
    const item = items[index];
    if (item) {
      command(item);
    }
  };

  const upHandler = () => {
    setSelectedIndex((selectedIndex + items.length - 1) % items.length);
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: (event: KeyboardEvent) => {
      if (event.key === 'ArrowUp') {
        upHandler();
        return true;
      }

      if (event.key === 'ArrowDown') {
        downHandler();
        return true;
      }

      if (event.key === 'Enter') {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {items.length ? (
        <div className="max-h-[200px] overflow-y-auto">
          {items.map((item, index) => (
            <button
              key={item.id}
              className={`
                w-full px-4 py-2 text-left flex items-center gap-2
                ${
                  index === selectedIndex
                    ? 'bg-blue-50 dark:bg-blue-900/20'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }
              `}
              onClick={() => selectItem(index)}
            >
              {item.avatar && (
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  {item.name}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {item.email}
                </div>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">
          No results
        </div>
      )}
    </div>
  );
});

MentionList.displayName = 'MentionList';

export default MentionList;
