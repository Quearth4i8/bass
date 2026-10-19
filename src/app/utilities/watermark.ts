/**
 * Version of the gallery watermark the backend draws (PortalMediaController).
 *
 * Watermarked images are served with a 30-day public cache, so when the mark
 * changes, browsers that already hold an image keep showing the old one - the
 * URL is the same, so they never ask again. Appending this to every /thumb/
 * and /wm/ URL gives each image a new address. Bump it together with the
 * backend's WM_*_CACHE folder suffix whenever the watermark text changes.
 *
 * v2: "© <Project> · BASSIANA" -> "© INSTM · BASSIANA"
 */
export const WATERMARK_VERSION = 2;
