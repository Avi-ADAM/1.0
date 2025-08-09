/*
	Installed from @ieedan/shadcn-svelte-extras
*/

import type { ReadableBoxedValues, WritableBoxedValues } from 'svelte-toolbelt';
import { Context } from 'runed';
import type { CropArea, DispatchEvents } from 'svelte-easy-crop';
import { getCroppedImg } from './utils';

// https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img#supported_image_formats
export const VALID_IMAGE_TYPES = [
  'image/apng',
  'image/avif',
  'image/gif',
  'image/jpeg',
  'image/png',
  'image/svg+xml',
  'image/webp'
];

export type ImageCropperRootProps = WritableBoxedValues<{
  src: string;
}> &
  ReadableBoxedValues<{
    id: string;
    onCropped: (url: string) => void;
    onUnsupportedFile: (file: File) => void;
  }>;

class ImageCropperRootState {
  #createdUrls = $state<string[]>([]);
  open = $state(false);
  tempUrl = $state<string>();
  pixelCrop = $state<CropArea>();

  constructor(readonly opts: ImageCropperRootProps) {
    this.onUpload = this.onUpload.bind(this);
    this.onCancel = this.onCancel.bind(this);
    this.onCrop = this.onCrop.bind(this);
    this.dispose = this.dispose.bind(this);
  }

  onUpload(file: File) {
    if (!VALID_IMAGE_TYPES.includes(file.type)) {
      this.opts.onUnsupportedFile.current(file);
      return;
    }

    this.tempUrl = URL.createObjectURL(file);
    this.#createdUrls.push(this.tempUrl);
    this.open = true;
  }

  onCancel() {
    this.tempUrl = undefined;
    this.open = false;
    this.pixelCrop = undefined;
  }

  async onCrop() {
    if (!this.pixelCrop || !this.tempUrl) return;

    this.opts.src.current = await getCroppedImg(this.tempUrl, this.pixelCrop);

    this.open = false;

    this.opts.onCropped.current(this.opts.src.current);
  }

  get src() {
    return this.opts.src.current;
  }

  get id() {
    return this.opts.id.current;
  }

  dispose() {
    for (const url of this.#createdUrls) {
      URL.revokeObjectURL(url);
    }
  }
}

export type ImageCropperTriggerProps = ReadableBoxedValues<{
  id?: string;
}>;

class ImageCropperTriggerState {
  constructor(readonly rootState: ImageCropperRootState) {}
}

class ImageCropperPreviewState {
  constructor(readonly rootState: ImageCropperRootState) {}
}

class ImageCropperDialogState {
  constructor(readonly rootState: ImageCropperRootState) {}
}

class ImageCropperCropperState {
  constructor(readonly rootState: ImageCropperRootState) {
    this.onCropComplete = this.onCropComplete.bind(this);
  }

  onCropComplete(e: DispatchEvents['cropcomplete']) {
    this.rootState.pixelCrop = e.pixels;
  }
}

class ImageCropperCropState {
  constructor(readonly rootState: ImageCropperRootState) {
    this.onclick = this.onclick.bind(this);
  }

  onclick() {
    this.rootState.onCrop();
  }
}

class ImageCropperCancelState {
  constructor(readonly rootState: ImageCropperRootState) {
    this.onclick = this.onclick.bind(this);
  }

  onclick() {
    this.rootState.onCancel();
  }
}

const ImageCropperRootContext = new Context<ImageCropperRootState>(
  'ImageCropper.Root'
);

export const useImageCropperRoot = (props: ImageCropperRootProps) => {
  return ImageCropperRootContext.set(new ImageCropperRootState(props));
};

export const useImageCropperTrigger = () => {
  const rootState = ImageCropperRootContext.get();

  return new ImageCropperTriggerState(rootState);
};

export const useImageCropperPreview = () => {
  const rootState = ImageCropperRootContext.get();

  return new ImageCropperPreviewState(rootState);
};

export const useImageCropperDialog = () => {
  const rootState = ImageCropperRootContext.get();

  return new ImageCropperDialogState(rootState);
};

export const useImageCropperCropper = () => {
  const rootState = ImageCropperRootContext.get();

  return new ImageCropperCropperState(rootState);
};

export const useImageCropperCrop = () => {
  const rootState = ImageCropperRootContext.get();

  return new ImageCropperCropState(rootState);
};

export const useImageCropperCancel = () => {
  const rootState = ImageCropperRootContext.get();

  return new ImageCropperCancelState(rootState);
};
