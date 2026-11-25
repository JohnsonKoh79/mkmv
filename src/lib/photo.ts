export const avatarUrl = (path: string | null | undefined) =>
  path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${path}` : null;

/** Crop to 4:5, max 800 wide, JPEG. Keeps uploads small on a phone connection. */
export async function squarePhoto(file: File): Promise<Blob> {
  const bmp = await createImageBitmap(file);
  const ratio = 4 / 5;
  let sw = bmp.width, sh = bmp.height;
  if (sw / sh > ratio) sw = sh * ratio; else sh = sw / ratio;
  const sx = (bmp.width - sw) / 2, sy = (bmp.height - sh) / 2;
  const w = Math.min(800, Math.round(sw)), h = Math.round(w / ratio);
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  canvas.getContext("2d")!.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h);
  return new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error("photo"))), "image/jpeg", 0.85));
}
