import type { ErrorDetail } from "../interfaces/IResponse.interface";

function joinPath(segments: readonly (string | number)[]): string {
  return segments.map(String).join(".");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isErrorDetail(value: unknown): value is ErrorDetail {
  return (
    isRecord(value) &&
    typeof value.message === "string" &&
    (value.field === undefined || typeof value.field === "string") &&
    (value.code === undefined || typeof value.code === "string")
  );
}

function normalizeZodIssues(issues: unknown[]): ErrorDetail[] {
  const details: ErrorDetail[] = [];

  for (const issue of issues) {
    if (!isRecord(issue) || typeof issue.message !== "string") continue;

    const path = Array.isArray(issue.path) ? joinPath(issue.path) : undefined;
    details.push({
      field: path || undefined,
      message: issue.message,
      code: typeof issue.code === "string" ? issue.code : undefined,
    });
  }

  return details;
}

function normalizeJoiDetails(joiDetails: unknown[]): ErrorDetail[] {
  const details: ErrorDetail[] = [];

  for (const item of joiDetails) {
    if (!isRecord(item) || typeof item.message !== "string") continue;

    const path = Array.isArray(item.path) ? joinPath(item.path) : undefined;
    details.push({
      field: path || undefined,
      message: item.message,
      code: typeof item.type === "string" ? item.type : undefined,
    });
  }

  return details;
}

function flattenClassValidatorErrors(
  errors: unknown[],
  parentPath = "",
): ErrorDetail[] {
  const details: ErrorDetail[] = [];

  for (const entry of errors) {
    if (!isRecord(entry)) continue;

    const property =
      typeof entry.property === "string" ? entry.property : undefined;
    const field = parentPath && property ? `${parentPath}.${property}` : property;

    const constraints = entry.constraints;
    if (isRecord(constraints)) {
      for (const [code, message] of Object.entries(constraints)) {
        if (typeof message !== "string") continue;
        details.push({
          field,
          message,
          code,
        });
      }
    }

    if (Array.isArray(entry.children) && entry.children.length > 0 && property) {
      details.push(
        ...flattenClassValidatorErrors(
          entry.children,
          parentPath ? `${parentPath}.${property}` : property,
        ),
      );
    }
  }

  return details;
}

function normalizeRecordErrors(record: Record<string, unknown>): ErrorDetail[] {
  const details: ErrorDetail[] = [];

  for (const [field, value] of Object.entries(record)) {
    if (typeof value === "string") {
      details.push({ field, message: value });
      continue;
    }

    if (Array.isArray(value)) {
      for (const message of value) {
        if (typeof message === "string") {
          details.push({ field, message });
        }
      }
    }
  }

  return details;
}

/**
 * Normalizes validation output from Zod, Joi, class-validator, or plain structures
 * into BaR {@link ErrorDetail} entries for `error.details`.
 */
export function normalizeValidationErrors(input: unknown): ErrorDetail[] {
  if (Array.isArray(input)) {
    if (input.every(isErrorDetail)) {
      return input;
    }

    const classValidator = flattenClassValidatorErrors(input);
    if (classValidator.length > 0) {
      return classValidator;
    }

    return input
      .filter(isRecord)
      .map((item) => ({
        field: typeof item.field === "string" ? item.field : undefined,
        message: typeof item.message === "string" ? item.message : String(item),
        code: typeof item.code === "string" ? item.code : undefined,
      }))
      .filter((item) => item.message.length > 0);
  }

  if (isRecord(input)) {
    if (Array.isArray(input.issues)) {
      const zod = normalizeZodIssues(input.issues);
      if (zod.length > 0) return zod;
    }

    if (Array.isArray(input.details)) {
      const joi = normalizeJoiDetails(input.details);
      if (joi.length > 0) return joi;
    }

    return normalizeRecordErrors(input);
  }

  if (typeof input === "string") {
    return [{ message: input }];
  }

  return [{ message: "Validation failed" }];
}
