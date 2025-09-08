'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';

import { FieldError } from '../error';
import { LabelArea } from '../label';
import { FieldWrapper } from '../wrapper';
import { useFieldContext } from '@/components/form/form-context';

interface KeyValuePair {
  key: string;
  value: string;
}

interface DefaultKey {
  key: string;
  label: string;
}

interface KeyValuePairEditorProps {
  label?: string;
  id: string;
  description?: string;
  required?: boolean;
  maxPairs?: number;
  defaultKeys?: DefaultKey[];
}

interface PairItemProps {
  pair: KeyValuePair;
  index: number;
  total: number;
  onRemove: () => void;
  onUpdate: (field: 'key' | 'value', value: string) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  defaultKeys?: DefaultKey[];
  usedKeys: string[];
}

const PairItem = ({
  pair,
  index,
  total,
  onRemove,
  onUpdate,
  onMoveUp,
  onMoveDown,
  defaultKeys,
  usedKeys,
}: PairItemProps) => {
  const availableKeys = defaultKeys?.filter(
    (dk) => dk.key === pair.key || !usedKeys.includes(dk.key),
  );

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-md hover:bg-muted/30 transition-all',
      )}
    >
      <div className="flex flex-col gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMoveUp}
          disabled={index === 0}
          className="h-6 w-6"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onMoveDown}
          disabled={index === total - 1}
          className="h-6 w-6"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>
      <div className="grid grid-cols-2 gap-2 flex-1">
        {defaultKeys ? (
          <Select
            value={pair.key}
            onValueChange={(value) => onUpdate('key', value)}
          >
            <div className="flex flex-col gap-2">
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma chave" />
              </SelectTrigger>
            </div>
            <SelectContent>
              {availableKeys?.map((dk) => (
                <SelectItem key={dk.key} value={dk.key}>
                  {dk.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            placeholder="Chave"
            value={pair.key}
            onChange={(e) => onUpdate('key', e.target.value)}
            className="flex-1"
          />
        )}
        <Input
          placeholder="Valor"
          value={pair.value}
          onChange={(e) => onUpdate('value', e.target.value)}
          className="flex-1"
        />
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={onRemove}
        className="text-destructive hover:text-destructive/80 hover:bg-destructive/10"
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
};

const KeyValuePairEditorComponent = ({
  label,
  id,
  description,
  required,
  maxPairs = 10,
  defaultKeys,
}: KeyValuePairEditorProps) => {
  const field = useFieldContext<Record<string, string>>();
  const [pairs, setPairs] = useState<KeyValuePair[]>(
    convertObjectToArray(field.state.value),
  );

  useEffect(() => {
    setPairs(convertObjectToArray(field.state.value));
  }, []);

  const updateFieldValue = (updatedPairs: KeyValuePair[]) => {
    setPairs(updatedPairs);
    field.setValue(convertArrayToObject(updatedPairs)); // Sem "specifications"
  };

  const addPair = () => {
    if (pairs.length < maxPairs) {
      updateFieldValue([...pairs, { key: '', value: '' }]);
    }
  };

  const removePair = (index: number) => {
    const newPairs = [...pairs];
    newPairs.splice(index, 1);
    updateFieldValue(newPairs);
  };

  const updatePair = (
    index: number,
    fieldData: 'key' | 'value',
    value: string,
  ) => {
    const newPairs = [...pairs];
    newPairs[index][fieldData] = value;
    updateFieldValue(newPairs);
  };

  const movePairUp = (index: number) => {
    if (index > 0) {
      const newPairs = [...pairs];
      [newPairs[index - 1], newPairs[index]] = [
        newPairs[index],
        newPairs[index - 1],
      ];
      updateFieldValue(newPairs);
    }
  };

  const movePairDown = (index: number) => {
    if (index < pairs.length - 1) {
      const newPairs = [...pairs];
      [newPairs[index], newPairs[index + 1]] = [
        newPairs[index + 1],
        newPairs[index],
      ];
      updateFieldValue(newPairs);
    }
  };

  const usedKeys = pairs.map((pair) => pair.key).filter(Boolean);
  const canAddMore = defaultKeys
    ? pairs.length < maxPairs && usedKeys.length < defaultKeys.length
    : pairs.length < maxPairs;

  return (
    <FieldWrapper>
      {label && (
        <div className="w-full flex items-center justify-between mb-2">
          <LabelArea label={label} htmlFor={id} required={required} />
          {maxPairs > 0 && (
            <Badge variant="outline" className="text-xs font-normal">
              {pairs.length}/{maxPairs} pares
            </Badge>
          )}
        </div>
      )}

      <div className="w-full space-y-3">
        {pairs.length > 0 ? (
          <div className="w-full flex flex-col gap-2">
            <div>
              {pairs.map((pair, index) => (
                <PairItem
                  key={index}
                  pair={pair}
                  index={index}
                  total={pairs.length}
                  onRemove={() => removePair(index)}
                  onUpdate={(field, value) => updatePair(index, field, value)}
                  onMoveUp={() => movePairUp(index)}
                  onMoveDown={() => movePairDown(index)}
                  defaultKeys={defaultKeys}
                  usedKeys={usedKeys}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center p-6 border border-dashed rounded-md text-muted-foreground bg-muted/30">
            Nenhum par chave-valor adicionado
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addPair}
          disabled={!canAddMore}
          className="w-full group hover:border-primary/50 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2 group-hover:text-primary transition-colors" />
          Adicionar par chave-valor
        </Button>
      </div>

      {description && (
        <span className="text-sm text-muted-foreground mt-2 block">
          {description}
        </span>
      )}
      <FieldError />
    </FieldWrapper>
  );
};

export default KeyValuePairEditorComponent;

// HELPERS
function convertObjectToArray(data?: Record<string, string>): KeyValuePair[] {
  if (!data) return [];
  return Object.entries(data).map(([key, value]) => ({ key, value }));
}

function convertArrayToObject(pairs: KeyValuePair[]): Record<string, string> {
  const obj: Record<string, string> = {};
  for (const pair of pairs) {
    if (pair.key) obj[pair.key] = pair.value;
  }
  return obj;
}
