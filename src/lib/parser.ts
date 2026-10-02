import { parse } from "csv-parse/sync";
import * as XLSX from "xlsx";
import fs from "fs/promises";

export interface ParsedRow {
  keyword: string;
  volume?: number;
  difficulty?: number;
  intent?: string;
  cluster?: string;
  city?: string;
  language?: string;
  notes?: string;
  slug_guess?: string;
  content_type?: string;
  priority?: number;
  status?: string;
  secondary_of?: string;
}

export interface ParseReport {
  fileName: string;
  rowsFound: number;
  keywordsSaved: number;
  duplicatesRemoved: number;
  rejected: { reason: string; count: number; samples: string[] }[];
  columnsDetected: Record<string, string>;
  clustersCreated: number;
  encoding: string;
  headerRow: number;
  warnings: string[];
}

const KEYWORD_HEADER_SYNONYMS = [
  "keyword",
  "keywords",
  "main keyword",
  "primary keyword",
  "focus keyword",
  "key phrase",
  "query",
  "search query",
  "search term",
  "topic",
  "title",
  "article topic",
  "key word",
  "kw",
];

const COLUMN_MAP: Record<string, string[]> = {
  volume: ["volume", "search volume", "sv", "monthly searches", "avg monthly searches"],
  difficulty: ["difficulty", "kd", "competition", "keyword difficulty"],
  intent: ["intent", "search intent", "keyword intent"],
  secondary_of: ["secondary", "supporting", "lsi", "related"],
  cluster: ["cluster", "topic cluster", "group", "category", "pillar"],
  slug_guess: ["url", "link", "page", "target url"],
  content_type: ["content type", "format", "page type"],
  notes: ["notes", "comment", "brief"],
  priority: ["priority"],
  status: ["status"],
  language: ["language"],
  city: ["city", "location", "region"],
};

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

function isHeaderRow(row: string[]): boolean {
  if (row.length === 0) return false;
  const nonEmpty = row.filter((c) => c.trim() !== "").length;
  const shortText = row.filter((c) => {
    const t = c.trim();
    return t.length > 0 && t.length < 50 && isNaN(Number(t));
  }).length;
  return shortText / nonEmpty >= 0.5;
}

function detectDelimiter(sample: string): string {
  const lines = sample.split(/\r?\n/).slice(0, 5);
  const delimiters = [",", ";", "\t", "|"];
  let best = ",";
  let bestCount = 0;
  for (const d of delimiters) {
    const counts = lines.map((l) => (l.match(new RegExp(`\\${d}`, "g")) || []).length);
    const total = counts.reduce((a, b) => a + b, 0);
    if (total > bestCount) {
      bestCount = total;
      best = d;
    }
  }
  return best;
}

export function cleanKeyword(raw: string): { keyword: string; valid: boolean; reason?: string } {
  if (!raw) return { keyword: "", valid: false, reason: "empty" };
  let k = raw
    .replace(/<[^>]+>/g, "")
    .replace(/^[\s"'“”‘’]+|[\s"'“”‘’]+$/g, "")
    .replace(/^[\d]+[.\)]+\s*/, "")
    .replace(/[\uFF10-\uFF19]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/\s+/g, " ")
    .trim();

  if (k.length < 2) return { keyword: k, valid: false, reason: "too short" };
  if (k.length > 120) return { keyword: k.slice(0, 120), valid: false, reason: "too long" };
  return { keyword: k, valid: true };
}

function normalizeForDedupe(k: string): string {
  return k
    .toLowerCase()
    .replace(/[^a-z0-9\u0900-\u097F\u0A80-\u0AFF\s]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .sort()
    .join(" ");
}

function detectKeywordColumn(headers: string[], rows: string[][]): { index: number; name: string } | null {
  // Try header synonyms first
  for (let i = 0; i < headers.length; i++) {
    const h = normalizeHeader(headers[i]);
    if (KEYWORD_HEADER_SYNONYMS.includes(h)) {
      return { index: i, name: headers[i] };
    }
  }
  // Fallback: text column with avg word count 2-6 and most unique values
  let bestIndex = -1;
  let bestScore = -1;
  for (let i = 0; i < headers.length; i++) {
    const values = rows.map((r) => r[i]).filter(Boolean);
    const words = values.map((v) => v.trim().split(/\s+/).length);
    const avg = words.reduce((a, b) => a + b, 0) / words.length;
    const unique = new Set(values.map((v) => v.toLowerCase().trim())).size;
    if (avg >= 2 && avg <= 6) {
      const score = unique + (6 - Math.abs(avg - 4)) * 10;
      if (score > bestScore) {
        bestScore = score;
        bestIndex = i;
      }
    }
  }
  if (bestIndex >= 0) {
    return { index: bestIndex, name: headers[bestIndex] };
  }
  return null;
}

function detectColumnMapping(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {};
  for (let i = 0; i < headers.length; i++) {
    const h = normalizeHeader(headers[i]);
    for (const [key, synonyms] of Object.entries(COLUMN_MAP)) {
      if (synonyms.includes(h) && !mapping[key]) {
        mapping[key] = headers[i];
      }
    }
  }
  return mapping;
}

function inferIntent(keyword: string): string {
  const k = keyword.toLowerCase();
  if (/\b(buy|price|cost|quote|services|for sale|near me|book|hire)\b/.test(k)) return "transactional";
  if (/\b(best|vs|review|top|compare|comparison)\b/.test(k)) return "commercial";
  if (/\b(what|why|how|guide|tutorial|tips|meaning)\b/.test(k)) return "informational";
  return "informational";
}

export async function parseKeywordFile(
  filePath: string,
  fileType: string,
  fileName: string
): Promise<{ rows: ParsedRow[]; report: ParseReport }> {
  let rows: ParsedRow[] = [];
  const report: ParseReport = {
    fileName,
    rowsFound: 0,
    keywordsSaved: 0,
    duplicatesRemoved: 0,
    rejected: [],
    columnsDetected: {},
    clustersCreated: 0,
    encoding: "UTF-8",
    headerRow: 1,
    warnings: [],
  };

  if (fileType === "csv" || fileType === "txt") {
    const buffer = await fs.readFile(filePath);
    const text = buffer.toString("utf-8");
    report.encoding = "UTF-8";

    let lines: string[];
    if (fileType === "txt") {
      lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
      rows = lines.map((l) => ({
        keyword: l.trim(),
      }));
    } else {
      const delimiter = detectDelimiter(text);
      const records = parse(text, { delimiter, columns: false, skip_empty_lines: true, trim: true });
      if (records.length === 0) {
        report.warnings.push("No rows found in CSV");
        return { rows, report };
      }
      let headerRowIndex = 0;
      if (isHeaderRow(records[0])) {
        headerRowIndex = 0;
      } else if (records.length > 1 && isHeaderRow(records[1])) {
        headerRowIndex = 1;
        report.headerRow = 2;
      } else {
        report.headerRow = 0;
      }
      const headers: string[] = headerRowIndex === 0 && isHeaderRow(records[0]) ? records[0] : records[0].map((_: unknown, i: number) => `Column ${i + 1}`);
      const dataRows = headerRowIndex === 0 && isHeaderRow(records[0]) ? records.slice(1) : records;
      report.columnsDetected = detectColumnMapping(headers);
      const kwCol = detectKeywordColumn(headers, dataRows);
      if (!kwCol) {
        report.warnings.push("Could not detect a keyword column; please use the column picker");
        return { rows, report };
      }
      report.columnsDetected.keyword = kwCol.name;
      rows = dataRows.map((r: string[]) => {
        const row: ParsedRow = { keyword: r[kwCol.index] || "" };
        const mapping = report.columnsDetected;
        if (mapping.volume) row.volume = Number(r[headers.indexOf(mapping.volume)]) || undefined;
        if (mapping.difficulty) row.difficulty = Number(r[headers.indexOf(mapping.difficulty)]) || undefined;
        if (mapping.intent) row.intent = r[headers.indexOf(mapping.intent)] || undefined;
        if (mapping.cluster) row.cluster = r[headers.indexOf(mapping.cluster)] || undefined;
        if (mapping.city) row.city = r[headers.indexOf(mapping.city)] || undefined;
        if (mapping.language) row.language = r[headers.indexOf(mapping.language)] || undefined;
        if (mapping.notes) row.notes = r[headers.indexOf(mapping.notes)] || undefined;
        if (mapping.slug_guess) row.slug_guess = r[headers.indexOf(mapping.slug_guess)] || undefined;
        if (mapping.content_type) row.content_type = r[headers.indexOf(mapping.content_type)] || undefined;
        if (mapping.priority) row.priority = Number(r[headers.indexOf(mapping.priority)]) || undefined;
        if (mapping.status) row.status = r[headers.indexOf(mapping.status)] || undefined;
        if (mapping.secondary_of) row.secondary_of = r[headers.indexOf(mapping.secondary_of)] || undefined;
        return row;
      });
    }
  } else if (fileType === "xlsx" || fileType === "xls") {
    const buffer = await fs.readFile(filePath);
    const workbook = XLSX.read(buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" }) as string[][];
    if (json.length === 0) {
      report.warnings.push("No rows found in Excel file");
      return { rows, report };
    }
    let headerRowIndex = 0;
    if (!isHeaderRow(json[0]) && json.length > 1 && isHeaderRow(json[1])) {
      headerRowIndex = 1;
      report.headerRow = 2;
    }
    const headers = json[headerRowIndex].map(String);
    const dataRows = json.slice(headerRowIndex + 1);
    report.columnsDetected = detectColumnMapping(headers);
    const kwCol = detectKeywordColumn(headers, dataRows as string[][]);
    if (!kwCol) {
      report.warnings.push("Could not detect a keyword column; please use the column picker");
      return { rows, report };
    }
    report.columnsDetected.keyword = kwCol.name;
    rows = dataRows.map((r) => {
      const row: ParsedRow = { keyword: String(r[kwCol.index] || "") };
      const mapping = report.columnsDetected;
      if (mapping.volume) row.volume = Number(r[headers.indexOf(mapping.volume)]) || undefined;
      if (mapping.difficulty) row.difficulty = Number(r[headers.indexOf(mapping.difficulty)]) || undefined;
      if (mapping.intent) row.intent = String(r[headers.indexOf(mapping.intent)] || "").trim() || undefined;
      if (mapping.cluster) row.cluster = String(r[headers.indexOf(mapping.cluster)] || "").trim() || undefined;
      if (mapping.city) row.city = String(r[headers.indexOf(mapping.city)] || "").trim() || undefined;
      if (mapping.notes) row.notes = String(r[headers.indexOf(mapping.notes)] || "").trim() || undefined;
      return row;
    });
  } else if (fileType === "pdf") {
    const buffer = await fs.readFile(filePath);
    const pdfParseModule = await import("pdf-parse");
    const pdfParse = ((pdfParseModule as unknown as { default?: unknown }).default || pdfParseModule) as unknown as (buf: Buffer) => Promise<{ text: string }>;
    const parsed = await pdfParse(buffer);
    const lines = parsed.text.split(/\r?\n/).filter((l: string) => l.trim() !== "");
    rows = lines
      .filter((l: string) => l.trim().split(/\s+/).length <= 12 && !l.match(/^(page|\d+)$/i))
      .map((l: string) => ({ keyword: l.trim() }));
    report.warnings.push("PDF parsed; please review before saving");
  } else if (fileType === "docx") {
    const buffer = await fs.readFile(filePath);
    const mammothModule = await import("mammoth");
    const mammoth = ((mammothModule as unknown as { default?: unknown }).default || mammothModule) as unknown as { extractRawText: (input: { buffer: Buffer }) => Promise<{ value: string }> };
    const result = await mammoth.extractRawText({ buffer });
    const lines = result.value.split(/\r?\n/).filter((l: string) => l.trim() !== "");
    rows = lines
      .filter((l: string) => l.trim().split(/\s+/).length <= 12 && !l.match(/^(page|\d+)$/i))
      .map((l: string) => ({ keyword: l.trim() }));
    report.warnings.push("DOCX parsed; please review before saving");
  } else if (fileType === "json") {
    const text = (await fs.readFile(filePath)).toString("utf-8");
    let data: unknown;
    try {
      data = JSON.parse(text);
    } catch {
      report.warnings.push("Invalid JSON");
      return { rows, report };
    }
    if (Array.isArray(data)) {
      rows = data.map((item) =>
        typeof item === "string" ? { keyword: item } : { keyword: item?.keyword || item?.query || "" }
      );
    } else if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      const list = obj.keywords || obj.data || obj.items || [];
      rows = (Array.isArray(list) ? list : []).map((item) =>
        typeof item === "string" ? { keyword: item } : { keyword: item?.keyword || item?.query || "" }
      );
    }
  }

  // Clean, validate, deduplicate
  report.rowsFound = rows.length;
  const seen = new Map<string, ParsedRow>();
  const rejectedCounts: Record<string, { count: number; samples: string[] }> = {};

  const cleaned: ParsedRow[] = [];
  for (const row of rows) {
    const cleanedKw = cleanKeyword(row.keyword);
    if (!cleanedKw.valid) {
      if (!rejectedCounts[cleanedKw.reason!]) rejectedCounts[cleanedKw.reason!] = { count: 0, samples: [] };
      rejectedCounts[cleanedKw.reason!].count++;
      if (rejectedCounts[cleanedKw.reason!].samples.length < 3) {
        rejectedCounts[cleanedKw.reason!].samples.push(row.keyword);
      }
      continue;
    }
    const normalized = normalizeForDedupe(cleanedKw.keyword);
    const existing = seen.get(normalized);
    if (existing) {
      // Keep row with more metadata
      const existingScore = Object.values(existing).filter(Boolean).length;
      const newScore = Object.values({ ...row, keyword: cleanedKw.keyword }).filter(Boolean).length;
      if (newScore > existingScore) {
        seen.set(normalized, { ...row, keyword: cleanedKw.keyword });
      }
      report.duplicatesRemoved++;
      continue;
    }
    const finalRow = { ...row, keyword: cleanedKw.keyword };
    if (!finalRow.intent) {
      finalRow.intent = inferIntent(finalRow.keyword);
      if (Math.random() < 0.05) report.warnings.push("Some intents were guessed from the keyword text");
    }
    seen.set(normalized, finalRow);
    cleaned.push(finalRow);
  }

  report.keywordsSaved = cleaned.length;
  report.rejected = Object.entries(rejectedCounts).map(([reason, data]) => ({
    reason,
    count: data.count,
    samples: data.samples,
  }));

  return { rows: cleaned, report };
}
