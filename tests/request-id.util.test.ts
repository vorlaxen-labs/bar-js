import { resolveRequestId } from "../src/utils/request-id.util";

describe("resolveRequestId", () => {
  it("üretilen id geçerli UUID formatında olmalı", () => {
    const id = resolveRequestId({});
    expect(id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it("X-Request-ID header değerini kullanmalı (UUID)", () => {
    const incoming = "a1b2c3d4-e5f6-4789-a012-3456789abcde";
    const id = resolveRequestId({
      headers: { "x-request-id": incoming },
    });
    expect(id).toBe(incoming);
  });

  it("X-Request-ID UUID değilse olduğu gibi korumalı", () => {
    const id = resolveRequestId({
      headers: { "x-request-id": "upstream-trace-abc" },
    });
    expect(id).toBe("upstream-trace-abc");
  });

  it("X-Correlation-ID fallback olarak kullanılmalı", () => {
    const id = resolveRequestId({
      headers: { "x-correlation-id": "corr-99" },
    });
    expect(id).toBe("corr-99");
  });

  it("traceparent W3C trace id çıkarılmalı", () => {
    const traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
    const id = resolveRequestId({
      headers: {
        traceparent: `00-${traceId}-00f067aa0ba902b7-01`,
      },
    });
    expect(id).toBe(
      "4bf92f35-77b3-4da6-a3ce-929d0e0e4736",
    );
  });

  it("req.get() Express tarzı okuma desteklemeli", () => {
    const id = resolveRequestId({
      get: (name) => (name === "x-request-id" ? "from-getter" : undefined),
    });
    expect(id).toBe("from-getter");
  });

  it("özel header listesi kullanılabilmeli", () => {
    const id = resolveRequestId(
      { headers: { "x-custom-trace": "custom-1" } },
      ["x-custom-trace"],
    );
    expect(id).toBe("custom-1");
  });
});
