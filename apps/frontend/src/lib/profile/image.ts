import { MAX_AVATAR_BYTES } from "@/lib/profile/avatar-storage";

export function validateAvatarFile(file: File) {
  if (!file.type.startsWith("image/")) {
    throw new Error("Please choose an image file.");
  }

  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error("Images must be 2 MB or smaller.");
  }
}

async function fileToImageBitmap(file: File) {
  return createImageBitmap(file);
}

function loadCanvas(bitmap: ImageBitmap, size: number) {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("We couldn't process that image right now.");
  }

  const minDimension = Math.min(bitmap.width, bitmap.height);
  const sourceX = Math.max(0, (bitmap.width - minDimension) / 2);
  const sourceY = Math.max(0, (bitmap.height - minDimension) / 2);

  context.drawImage(
    bitmap,
    sourceX,
    sourceY,
    minDimension,
    minDimension,
    0,
    0,
    size,
    size,
  );

  return canvas;
}

async function canvasToFile(canvas: HTMLCanvasElement, type: string, quality: number) {
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, type, quality);
  });

  if (!blob) {
    throw new Error("We couldn't process that image right now.");
  }

  return new File([blob], "avatar.jpg", {
    type: blob.type || "image/jpeg",
    lastModified: Date.now(),
  });
}

export async function cropAndCompressAvatar(file: File) {
  validateAvatarFile(file);

  const bitmap = await fileToImageBitmap(file);

  try {
    const canvas = loadCanvas(bitmap, 256);
    let processed = await canvasToFile(canvas, "image/jpeg", 0.9);

    if (processed.size > MAX_AVATAR_BYTES) {
      processed = await canvasToFile(canvas, "image/jpeg", 0.7);
    }

    if (processed.size > MAX_AVATAR_BYTES) {
      throw new Error("We couldn't compress that image below 2 MB.");
    }

    return processed;
  } finally {
    bitmap.close();
  }
}
