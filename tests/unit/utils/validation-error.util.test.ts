import { normalizeValidationErrors } from "../../../src/utils/validation-error.util";

describe("normalizeValidationErrors", () => {
  it("Zod issues formatını dönüştürmeli", () => {
    expect(
      normalizeValidationErrors({
        issues: [{ path: ["user", "email"], message: "Invalid", code: "invalid" }],
      }),
    ).toEqual([
      { field: "user.email", message: "Invalid", code: "invalid" },
    ]);
  });

  it("Joi details formatını dönüştürmeli", () => {
    expect(
      normalizeValidationErrors({
        details: [{ path: ["password"], message: "Too short", type: "string.min" }],
      }),
    ).toEqual([
      { field: "password", message: "Too short", code: "string.min" },
    ]);
  });

  it("class-validator hatalarını düzleştirmeli", () => {
    expect(
      normalizeValidationErrors([
        {
          property: "email",
          constraints: { isEmail: "email must be an email" },
        },
      ]),
    ).toEqual([
      { field: "email", message: "email must be an email", code: "isEmail" },
    ]);
  });

  it("Record<string, string | string[]> formatını desteklemeli", () => {
    expect(
      normalizeValidationErrors({
        name: "Required",
        tags: ["Too many", "Invalid tag"],
      }),
    ).toEqual([
      { field: "name", message: "Required" },
      { field: "tags", message: "Too many" },
      { field: "tags", message: "Invalid tag" },
    ]);
  });
});
