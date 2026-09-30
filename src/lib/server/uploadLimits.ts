import { NextResponse } from 'next/server';

/**
 * Upload Limits & Validation Helpers
 * Strictly limits payload sizes to prevent Denial of Service via memory exhaustion.
 */

export const UPLOAD_LIMITS = {
  TEXT_DIAGRAM_MAX_BYTES: 2 * 1024 * 1024,   // 2MB (Mermaid, PlantUML, JSON, XML)
  IMAGE_MAX_BYTES: 10 * 1024 * 1024,         // 10MB (PNG, JPG, WebP)
  DOCUMENT_MAX_BYTES: 15 * 1024 * 1024,      // 15MB (PDF)
} as const;

export function validatePayloadSize(
  contentLength: number | null | undefined,
  maxBytes: number,
  resourceName: string = 'Arquivo'
): NextResponse | null {
  if (contentLength && contentLength > maxBytes) {
    const maxMb = (maxBytes / (1024 * 1024)).toFixed(1);
    return NextResponse.json(
      {
        error: `${resourceName} excede o limite máximo permitido de ${maxMb}MB.`,
        code: 'PAYLOAD_TOO_LARGE',
        maxAllowedBytes: maxBytes,
      },
      { status: 413 }
    );
  }
  return null;
}
