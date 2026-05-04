import crypto from "crypto";

export class CryptoUtil {
  static generateUUID(): string {
    if (crypto.randomUUID) return crypto.randomUUID();
    return crypto
      .randomBytes(16)
      .toString("hex")
      .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-4$3-$4-$5");
  }

  static isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
