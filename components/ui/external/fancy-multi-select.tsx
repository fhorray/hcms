'use client';

import * as React from 'react';
import { X, Plus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  className?: string;
  maxTags?: number;
  allowDuplicates?: boolean;
  disabled?: boolean;
}

export function FancyMultiSelect({
  value = [],
  onChange,
  suggestions = [],
  placeholder = 'Digite uma tag...',
  className,
  maxTags,
  allowDuplicates = false,
  disabled = false,
}: TagInputProps) {
  const [inputValue, setInputValue] = React.useState('');
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Protege contra dados inválidos
  const safeSuggestions = React.useMemo(
    () => (suggestions ?? []).filter((s): s is string => typeof s === 'string'),
    [suggestions],
  );
  const safeValue = React.useMemo(
    () => (value ?? []).filter((v): v is string => typeof v === 'string'),
    [value],
  );

  const canCreateTag = React.useCallback(
    (text: string) => {
      const q = text.trim();
      if (!q) return false;
      const existsInSuggestions = safeSuggestions.some(
        (s) => s.toLowerCase() === q.toLowerCase(),
      );
      const existsInValue = safeValue.some(
        (v) => v.toLowerCase() === q.toLowerCase(),
      );
      return !existsInSuggestions && (allowDuplicates || !existsInValue);
    },
    [safeSuggestions, safeValue, allowDuplicates],
  );

  const baseSuggestions = React.useMemo(() => {
    return safeSuggestions.filter(
      (s) =>
        allowDuplicates ||
        !safeValue.some((v) => v.toLowerCase() === s.toLowerCase()),
    );
  }, [safeSuggestions, safeValue, allowDuplicates]);

  const visibleSuggestions = React.useMemo(() => {
    const q = inputValue.trim().toLowerCase();
    if (!q) return baseSuggestions;
    return baseSuggestions.filter((s) => s.toLowerCase().includes(q));
  }, [inputValue, baseSuggestions]);

  const canAddNewTag = React.useMemo(
    () => canCreateTag(inputValue),
    [canCreateTag, inputValue],
  );

  const decideOpenFromText = React.useCallback(
    (text: string) => {
      const q = text.trim().toLowerCase();
      const nextBase = safeSuggestions.filter(
        (s) =>
          allowDuplicates ||
          !safeValue.some((v) => v.toLowerCase() === s.toLowerCase()),
      );
      const nextVisible = q
        ? nextBase.filter((s) => s.toLowerCase().includes(q))
        : nextBase;
      const nextCanAdd =
        !!q &&
        !safeSuggestions.some((s) => s.toLowerCase() === q) &&
        (allowDuplicates || !safeValue.some((v) => v.toLowerCase() === q));
      setIsOpen(nextVisible.length > 0 || nextCanAdd);
    },
    [safeSuggestions, safeValue, allowDuplicates],
  );

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    if (
      !allowDuplicates &&
      safeValue.some((v) => v.toLowerCase() === trimmedTag.toLowerCase())
    )
      return;
    if (maxTags && safeValue.length >= maxTags) return;

    onChange([...safeValue, trimmedTag]);
    setInputValue('');
    setIsOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(safeValue.filter((tag) => tag !== tagToRemove));
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (inputValue.trim()) addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && safeValue.length > 0) {
      removeTag(safeValue[safeValue.length - 1]);
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    decideOpenFromText(newValue);
  };

  const handlePopoverMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
  };

  return (
    <div className={cn('w-full', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <PopoverTrigger className="w-full" disabled={disabled} asChild>
          <div className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <div className="flex flex-wrap gap-1">
              {safeValue.map((tag, index) => (
                <Badge
                  key={`${tag}-${index}`}
                  variant="secondary"
                  className="gap-1 pr-1 text-xs"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 rounded-full hover:bg-muted-foreground/20"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                onFocus={() => {
                  if (maxTags && safeValue.length >= maxTags) return;
                  setIsOpen(visibleSuggestions.length > 0 || canAddNewTag);
                }}
                placeholder={safeValue.length === 0 ? placeholder : ''}
                className="w-full flex-1 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                disabled={maxTags ? safeValue.length >= maxTags : false}
              />
            </div>
          </div>
        </PopoverTrigger>

        <PopoverContent
          className="p-0 w-[var(--radix-popper-anchor-width)]"
          align="start"
          forceMount
          onOpenAutoFocus={(e) => e.preventDefault()}
          onCloseAutoFocus={(e) => e.preventDefault()}
          onMouseDown={handlePopoverMouseDown}
        >
          <Command className="w-full">
            <CommandList className="w-full">
              {visibleSuggestions.length === 0 && !canAddNewTag && (
                <CommandEmpty>Nenhuma sugestão encontrada.</CommandEmpty>
              )}
              <CommandGroup>
                {visibleSuggestions.map((suggestion, index) => (
                  <CommandItem
                    key={`${suggestion}-${index}`}
                    onSelect={() => addTag(suggestion)}
                    className="cursor-pointer"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    {suggestion}
                  </CommandItem>
                ))}
                {canAddNewTag && (
                  <CommandItem
                    onSelect={() => addTag(inputValue)}
                    className="cursor-pointer text-muted-foreground"
                    onMouseDown={(e) => e.preventDefault()}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar "{inputValue}"
                  </CommandItem>
                )}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
