/**
 * The limits a picture must meet before it is uploaded: its file size and
 * its dimensions. Checked in the browser for every picture uploaded from the
 * admin, so an editor hears about it before the upload starts; the server
 * enforces the file size again (src/cms/media.ts).
 */
export const IMAGE_LIMITS = {
  /** Same as the server's limit for pictures. */
  maxBytes: 15 * 1024 * 1024,
  /** Longest side, in pixels: larger photos only slow the site down. */
  maxSide: 6000,
  /** Shortest side, in pixels: smaller photos look blurred on the site. */
  minSide: 400,
};

export const IMAGE_HINT = `الصور: حتى ${IMAGE_LIMITS.maxBytes / 1024 / 1024} ميغابايت، وأبعاد بين ${IMAGE_LIMITS.minSide} و${IMAGE_LIMITS.maxSide} بكسل لكل ضلع (يُفضَّل 1600 بكسل عرضًا). يمكن اختيار عدة صور مرة واحدة.`;

/** The picture's width and height, or null where the browser can't read it. */
function dimensions(file: File): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/** Why a picture can't be uploaded, or null when it meets the limits. Other files pass. */
export async function imageProblem(file: File): Promise<string | null> {
  if (!file.type.startsWith("image/")) return null;
  if (file.size > IMAGE_LIMITS.maxBytes) return `حجم الصورة أكبر من ${IMAGE_LIMITS.maxBytes / 1024 / 1024} ميغابايت.`;
  if (file.type === "image/svg+xml") return null;
  const size = await dimensions(file);
  if (!size) return null;
  const long = Math.max(size.width, size.height);
  const short = Math.min(size.width, size.height);
  if (long > IMAGE_LIMITS.maxSide) return `أبعاد الصورة ${size.width}×${size.height} بكسل، والحد الأقصى ${IMAGE_LIMITS.maxSide} بكسل. صغّرها ثم ارفعها.`;
  if (short < IMAGE_LIMITS.minSide) return `أبعاد الصورة ${size.width}×${size.height} بكسل، وهي أصغر من ${IMAGE_LIMITS.minSide} بكسل فستظهر مشوّشة.`;
  return null;
}
