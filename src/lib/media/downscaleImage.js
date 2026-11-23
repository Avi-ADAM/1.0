/**
 * Shrink a photo in the browser before it is uploaded for reading
 * (/join/supplier's catalog upload, PLAN_SUPPLIER_GROWTH SG1). A phone photo is
 * 3–8 MB; the model reads a 1600px JPEG just as well, at a tenth of the bytes.
 *
 * Returns the original file when it is not an image, is already small, or the
 * browser cannot decode it (HEIC outside Safari) — the server accepts those
 * as they are.
 */

const MAX_SIDE = 1600;
const SMALL_ENOUGH = 600 * 1024;

/**
 * @param {File} file
 * @returns {Promise<File>}
 */
export async function downscaleImage(file) {
  if (!file.type.startsWith('image/') || file.size <= SMALL_ENOUGH) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close?.();
    /** @type {Blob | null} */
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.82));
    if (!blob || blob.size >= file.size) return file;
    const name = file.name.replace(/\.[^.]+$/, '') + '.jpg';
    return new File([blob], name, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
