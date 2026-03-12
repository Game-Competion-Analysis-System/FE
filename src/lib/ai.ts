export type AiExtractedField = {
  fieldType: string | null;
  rawText: string | null;
  confidence: number | null;
};

export type AiAnalysis = {
  analysisId: number | null;
  uploadId: number | null;
  aiModelVersion: string | null;
  confidenceScore: number | null;
  processedTime: string | null;
  extractedFields: AiExtractedField[];
  raw: unknown;
};

function asNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function asString(value: unknown): string | null {
  if (typeof value === "string") {
    const s = value.trim();
    return s.length ? s : null;
  }
  return null;
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function normalizeAiExtractedField(input: unknown): AiExtractedField {
  const obj = (input && typeof input === "object" ? (input as Record<string, unknown>) : null) ?? {};
  return {
    fieldType: asString(obj.fieldType ?? obj.fieldtype),
    rawText: asString(obj.rawText ?? obj.rawtext),
    confidence: asNumber(obj.confidence),
  };
}

export function normalizeAiAnalysis(input: unknown): AiAnalysis {
  const obj = (input && typeof input === "object" ? (input as Record<string, unknown>) : null) ?? {};
  const extractedRaw = obj.aiExtractedFields ?? obj.aiextractedfields;
  const extractedFields = asArray(extractedRaw).map(normalizeAiExtractedField);

  return {
    analysisId: asNumber(obj.analysisId ?? obj.analysisid),
    uploadId: asNumber(obj.uploadId ?? obj.uploadid),
    aiModelVersion: asString(obj.aiModelVersion ?? obj.aimodelversion),
    confidenceScore: asNumber(obj.confidenceScore ?? obj.confidencescore ?? obj.confidence),
    processedTime: asString(obj.processedTime ?? obj.processedtime),
    extractedFields,
    raw: input,
  };
}

export function toConfidencePercent(score: number | null): number | null {
  if (score === null || !Number.isFinite(score)) return null;
  if (score >= 0 && score <= 1) return Math.round(score * 100);
  return Math.round(score);
}

