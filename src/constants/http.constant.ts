/** HTTP status codes that must not include a response body (RFC 7230/7231). */
export const NO_BODY_STATUS_CODES = new Set<number>([204, 205, 304]);

export function shouldSendResponseBody(statusCode: number): boolean {
  return !NO_BODY_STATUS_CODES.has(statusCode);
}
