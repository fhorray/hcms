import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import {
  ImageIcon,
  ImageUpscaleIcon,
  Loader2,
  Upload,
  XIcon,
} from 'lucide-react';
import React, { useCallback, useRef, useState } from 'react';
import { deleteImageFn, uploadImageFn } from '../../utils';
import { toast } from 'sonner';

interface ImageUploaderComponentProps extends NodeViewProps {
  updateAttributes: (
    attrs: Partial<{
      src: string;
      alt: string;
      title: string;
      width: number;
      height: number;
      loading: boolean;
    }>,
  ) => void;
  deleteNode: () => void;
}

interface ResizeModalProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  src: string;
  originalWidth: number;
  originalHeight: number;
  onApply: (width: number, height: number) => void;
}

export const ResizeModal = ({
  src,
  children,
  originalWidth,
  originalHeight,
  onApply,
}: ResizeModalProps) => {
  const [open, setOpen] = useState(false);
  const [width, setWidth] = useState(originalWidth);
  const [height, setHeight] = useState(originalHeight);
  const [maintainAspectRatio, setMaintainAspectRatio] = useState(false);
  const aspectRatio = originalWidth / originalHeight;

  const handleWidthChange = (value: number) => {
    setWidth(value);
    if (maintainAspectRatio) {
      setHeight(Math.round(value / aspectRatio));
    }
  };

  const handleHeightChange = (value: number) => {
    setHeight(value);
    if (maintainAspectRatio) {
      setWidth(Math.round(value * aspectRatio));
    }
  };

  const handleApply = () => {
    if (width < 100) {
      toast.error('Image too small!', {
        description: 'Image should be above 100px',
      });
      return;
    } else {
      onApply(width, height);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="w-7xl">
        <DialogHeader>
          <DialogTitle>Resize Image</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <div className="aspect-video bg-muted rounded-lg overflow-hidden">
              <img
                src={src}
                alt="Preview"
                className="w-full h-full object-contain"
                style={{ width, height }}
              />
            </div>
          </div>

          <div className="w-full md:w-64 space-y-4">
            <div>
              <Label className="mb-1 block">Width (px)</Label>
              <Input
                minLength={100}
                type="number"
                value={width}
                onChange={(e) => handleWidthChange(Number(e.target.value))}
              />
            </div>

            {/* <div>
              <Label className="mb-1 block">Height (px)</Label>
              <Input
                type="number"
                value={height}
                onChange={(e) => handleHeightChange(Number(e.target.value))}
              />
            </div> */}

            {/* <div className="flex items-center gap-2">
              <Checkbox
                id="aspect-ratio"
                checked={maintainAspectRatio}
                onCheckedChange={(checked) =>
                  setMaintainAspectRatio(Boolean(checked))
                }
              />
              <Label htmlFor="aspect-ratio">Maintain aspect ratio</Label>
            </div> */}

            <div className="flex gap-2 pt-4">
              <Button className="flex-1" onClick={handleApply}>
                Apply
              </Button>
              <DialogClose>
                <Button variant="outline" className="flex-1">
                  Cancel
                </Button>
              </DialogClose>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const ImageUploaderComponent: React.FC<ImageUploaderComponentProps> = ({
  node,
  updateAttributes,
  deleteNode,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const processImage = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Create an object URL for the file
      const imageUrl = URL.createObjectURL(file);

      // Load the image to get its dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = imageUrl;
      });

      setOriginalDimensions({
        width: img.naturalWidth,
        height: img.naturalHeight,
      });

      // Update attributes with original image
      updateAttributes({
        src: imageUrl,
        alt: file.name,
        title: file.name,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    } catch (err) {
      setError('Failed to process image');
      console.error('Image processing error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      await handleUpload(file);
    } else {
      setError('Please upload an image file');
    }
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        await handleUpload(file);
      }
    },
    [],
  );

  const handleResize = (width: number, height: number) => {
    updateAttributes({
      width,
      height,
    });
  };

  // Call API Functions
  const handleUpload = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      const imageUrl = await uploadImageFn(file);

      updateAttributes({
        src: imageUrl,
        alt: file.name,
        title: file.name,
      });
    } catch (err) {
      setError('Failed to upload image');
      console.error('Upload error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteFile = async (url: string): Promise<boolean> => {
    console.log('Delete file logic');

    setIsProcessing(true);
    setError(null);

    try {
      const result = await deleteImageFn(url);
      return result;
    } catch (error) {
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  if (node.attrs.src) {
    return (
      <NodeViewWrapper>
        <div className="relative w-fit group flex  hover:border cursor-pointer rounded-lg">
          <img
            ref={imageRef}
            src={node.attrs.src}
            alt={node.attrs.alt || ''}
            title={node.attrs.title || ''}
            width={node.attrs.width || undefined}
            height={node.attrs.height || undefined}
            className="max-w-full rounded-lg"
          />
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <ResizeModal
              src={node.attrs.src}
              originalWidth={originalDimensions?.width as number}
              originalHeight={originalDimensions?.height as number}
              onApply={handleResize}
            >
              <button
                type="button"
                className="p-1 rounded-full border cursor-pointer bg-white/90 text-gray-700 hover:bg-white transition-colors shadow-sm"
                aria-label="Resize image"
              >
                <ImageUpscaleIcon size={16} />
              </button>
            </ResizeModal>
            <button
              type="button"
              onClick={async () => {
                const isSuccess = await handleDeleteFile('');

                if (isSuccess) {
                  deleteNode();
                }
              }}
              className="p-1 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              aria-label="Remove image"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    );
  }

  return (
    <NodeViewWrapper>
      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center
          ${
            isDragging
              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
              : 'border-gray-300 dark:border-gray-700'
          }
          transition-colors duration-200
        `}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isProcessing}
        />

        <div className="flex flex-col items-center gap-2">
          {isProcessing ? (
            <>
              <Loader2 size={24} className="text-indigo-500 animate-spin" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Processing image...
              </p>
            </>
          ) : (
            <>
              <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                {isDragging ? <ImageIcon size={24} /> : <Upload size={24} />}
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDragging
                  ? 'Drop image here'
                  : 'Click or drag image to upload'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Supports: JPG, PNG, GIF
              </p>
            </>
          )}

          {error && (
            <p className="text-sm text-red-500 dark:text-red-400 mt-2">
              {error}
            </p>
          )}
        </div>
      </div>
    </NodeViewWrapper>
  );
};
