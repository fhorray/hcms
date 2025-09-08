import { AlertDialogHeader } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Editor } from '@tiptap/core';
import { TextSelection } from '@tiptap/pm/state';
import React, { useState } from 'react';

export const ImageDialog = ({
  children,
  editor,
}: {
  children: React.ReactNode;
  editor: Editor;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState('');
  return (
    <Dialog
      open={isOpen}
      onOpenChange={() => {
        setIsOpen(!isOpen);
        const { state, view } = editor;
        const { tr } = state;

        // Move o cursor para o final do documento (ou qualquer posição que faça o shouldShow retornar false)
        const pos = state.doc.content.size;

        const selection = TextSelection.create(state.doc, pos);
        const transaction = tr.setSelection(selection);
        view.dispatch(transaction);
        view.focus();
      }}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <AlertDialogHeader>
          <DialogTitle>Set Image URL</DialogTitle>
          <DialogDescription>Paste the image URL above</DialogDescription>
        </AlertDialogHeader>
        <Input
          type="url"
          placeholder="https://example.com/image.png"
          value={url}
          onChange={(e) => {
            const url = e.target.value;
            setUrl(url);
          }}
        />

        {/* Buttons */}
        <div className="w-full flex items-center gap-4 justify-end">
          <Button
            variant={'outline'}
            className="cursor-pointer"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            variant={'default'}
            className="cursor-pointer"
            onClick={() => {
              if (url) {
                editor.chain().focus().setImage({ src: url, alt: url }).run();
              }
              setIsOpen(false);
            }}
          >
            Confirm
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
