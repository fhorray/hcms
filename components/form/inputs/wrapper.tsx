import { cn } from '@/lib/utils';
import React from 'react';

export const FieldWrapper = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('w-full flex flex-col items-start gap-2', className)}>
      {children}
    </div>
  );
};
