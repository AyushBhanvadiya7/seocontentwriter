// Vercel Functions accept request bodies up to 4.5 MB. Keep the file limit
// below that ceiling to leave room for multipart/form-data boundaries and fields.
export const MAX_KEYWORD_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_KEYWORD_UPLOAD_LABEL = "4 MB";
