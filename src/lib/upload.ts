import path from "path";
import fs from "fs/promises";
import { v4 as uuidv4 } from "uuid";

// Upload folder: from .env when set, else ./uploads locally.
// On Vercel only /tmp is writable — and files there vanish after
// the request. That is fine for parse-then-delete flows (keywords),
// but permanent storage needs cloud buckets (a later step).
function resolveUploadDir(): string {
  const configured = process.env.UPLOAD_DIR?.trim();
  if (configured) {
    return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
  }
  if (process.env.VERCEL) return "/tmp/seo-writer-uploads";
  return path.join(process.cwd(), "uploads");
}

const UPLOAD_DIR = resolveUploadDir();

const ALLOWED_EXTENSIONS = [".csv", ".xlsx", ".xls", ".txt", ".json", ".pdf", ".docx"];
const BLOCKED_EXTENSIONS = [".php", ".phtml", ".js", ".exe", ".sh", ".svg", ".html", ".htaccess"];

export interface UploadedFile {
  originalName: string;
  storedName: string;
  filePath: string;
  fileType: string;
  size: number;
}

export async function ensureUploadDir() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
}

export function getExtension(filename: string) {
  return path.extname(filename).toLowerCase();
}

export function validateFileType(filename: string, mimeType: string) {
  const ext = getExtension(filename);
  if (BLOCKED_EXTENSIONS.includes(ext)) {
    return { valid: false, reason: `Blocked file type: ${ext}` };
  }
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return { valid: false, reason: `Only ${ALLOWED_EXTENSIONS.join(", ")} files are allowed` };
  }
  // Basic MIME sniff guard.
  const dangerous = ["application/x-php", "application/x-javascript", "text/html", "application/x-sh"];
  if (dangerous.some((m) => mimeType.includes(m))) {
    return { valid: false, reason: "Dangerous file content detected" };
  }
  return { valid: true };
}

export async function saveUploadedFile(
  file: File,
  prefix = "upload"
): Promise<UploadedFile> {
  await ensureUploadDir();
  const originalName = file.name.slice(0, 200);
  const ext = getExtension(originalName);
  const storedName = `${prefix}-${uuidv4()}${ext}`;
  const filePath = path.join(UPLOAD_DIR, storedName);
  const bytes = await file.arrayBuffer();
  await fs.writeFile(filePath, Buffer.from(bytes));
  return {
    originalName,
    storedName,
    filePath,
    fileType: ext.replace(".", ""),
    size: file.size,
  };
}

// Blocks path traversal (e.g. "../../etc/passwd") on read/delete.
function safePath(filePath: string): string | null {
  const resolved = path.resolve(filePath);
  if (resolved !== UPLOAD_DIR && !resolved.startsWith(UPLOAD_DIR + path.sep)) {
    return null;
  }
  return resolved;
}

export async function readUploadedFile(filePath: string): Promise<Buffer> {
  const safe = safePath(filePath);
  if (!safe) throw new Error("Invalid file path.");
  return fs.readFile(safe);
}

export async function deleteUploadedFile(filePath: string) {
  try {
    const safe = safePath(filePath);
    if (!safe) return;
    await fs.unlink(safe);
  } catch {
    // ignore
  }
}
