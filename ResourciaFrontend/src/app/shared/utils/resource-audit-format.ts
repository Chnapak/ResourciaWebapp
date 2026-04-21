export function formatAuditValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '-';
  }

  if (typeof value === 'string') {
    return value.trim().length > 0 ? value : '-';
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '-';
    }

    return value.map((item) => formatAuditValue(item)).join(', ');
  }

  if (isRecord(value)) {
    // Be defensive if the API sends JsonElement-like metadata objects.
    if (typeof value['rawText'] === 'string' && value['rawText'].trim().length > 0) {
      return value['rawText'];
    }

    if (typeof value['value'] === 'string' && value['value'].trim().length > 0) {
      return value['value'];
    }

    if (typeof value['stringValue'] === 'string' && value['stringValue'].trim().length > 0) {
      return value['stringValue'];
    }

    if (typeof value['valueKind'] === 'string' && Object.keys(value).length === 1) {
      return `[${value['valueKind']} value]`;
    }
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function formatAuditList(values: string[] | null | undefined): string {
  if (!values || values.length === 0) {
    return '-';
  }

  return values.join(', ');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
