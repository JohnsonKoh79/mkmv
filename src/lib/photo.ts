export const avatarUrl = (path: string | null | undefined) =>
  path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}` : null;

/** A 4:5 crop in the image's own pixels: centre point and zoom (1 = widest possible). */
export interface Crop { cx: number; cy: number; zoom: number }

export function cropBox(width: number, height: number, c: Crop) {
  const sw = Math.min(width, (height * 4) / 5) / c.zoom;
  const sh = (sw * 5) / 4;
  const sx = Math.min(Math.max(c.cx - sw / 2, 0), width - sw);
  const sy = Math.min(Math.max(c.cy - sh / 2, 0), height - sh);
  return { sx, sy, sw, sh };
}

/** Cuts out the chosen area as a JPEG, at most 800 wide. */
export async function cropPhoto(file: File, c: Crop): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const { sx, sy, sw, sh } = cropBox(bmp.width, bmp.height, c);
  const w = Math.min(800, Math.round(sw)), h = Math.round((w * 5) / 4);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("photo"))), "image/jpeg", 0.85));
}
