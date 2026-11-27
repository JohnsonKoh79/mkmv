export const avatarUrl = (path: string | null | undefined) =>
  path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}` : null;

/** A square crop in the image's own pixels: centre point and zoom (1 = widest possible). */
export interface Crop { cx: number; cy: number; zoom: number }

export function cropBox(width: number, height: number, c: Crop) {
  const sw = Math.min(width, height) / c.zoom;
  const sh = sw;
  const sx = Math.min(Math.max(c.cx - sw / 2, 0), width - sw);
  const sy = Math.min(Math.max(c.cy - sh / 2, 0), height - sh);
  return { sx, sy, sw, sh };
}

/** Cuts out the chosen area as a JPEG, at most 800 wide. */
export async function cropPhoto(file: File, c: Crop): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const { sx, sy, sw, sh } = cropBox(bmp.width, bmp.height, c);
  const w = Math.min(800, Math.round(sw)), h = w;
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("photo"))), "image/jpeg", 0.85));
}

/**
 * iPhones hand over HEIC photos that most desktop browsers cannot show. Re-save as JPEG (max 1600px) before upload.
 * The phone that took the photo can always read it; if a browser cannot, the original file is sent.
 */
export async function asJpeg(file: File, max = 1600): Promise<File> {
  try {
    const bmp = await createImageBitmap(file);
    const k = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * k); canvas.height = Math.round(bmp.height * k);
    canvas.getContext("2d")!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/jpeg", 0.85));
    if (!blob) return file;
    return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  }
}
