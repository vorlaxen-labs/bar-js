import {
  NO_BODY_STATUS_CODES,
  shouldSendResponseBody,
} from "../src/constants/http.constant";

describe("HTTP body helpers", () => {
  it("NO_BODY_STATUS_CODES doğru kodları içermeli", () => {
    expect(NO_BODY_STATUS_CODES.has(204)).toBe(true);
    expect(NO_BODY_STATUS_CODES.has(205)).toBe(true);
    expect(NO_BODY_STATUS_CODES.has(304)).toBe(true);
    expect(NO_BODY_STATUS_CODES.has(200)).toBe(false);
  });

  it("shouldSendResponseBody statusa göre dönmeli", () => {
    expect(shouldSendResponseBody(200)).toBe(true);
    expect(shouldSendResponseBody(404)).toBe(true);
    expect(shouldSendResponseBody(204)).toBe(false);
    expect(shouldSendResponseBody(304)).toBe(false);
  });
});
