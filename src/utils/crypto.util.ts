import crypto from "crypto";

export class CryptoUtil {
  static generateRandomString(length: number): string {
    return crypto
      .randomBytes(length)
      .toString("base64")
      .replace(/[/+=]/g, "")
      .slice(0, length);
  }

  static generateRandomIntInRange(min: number, max: number): number {
    if (min > max) {
      throw new Error("generateRandomIntInRange: 'min' değeri 'max'tan büyük olamaz");
    }
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static generateSecurePassword(length = 32): string {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+=-{}[]|:;"<>,.?/';

    const randomBytes = crypto.randomBytes(length);
    let password = "";

    for (let i = 0; i < length; i++) {
      password += charset[randomBytes[i] % charset.length];
    }

    return password;
  }

  static generateUUID(): string {
    if (crypto.randomUUID) return crypto.randomUUID();
    return crypto
      .randomBytes(16)
      .toString("hex")
      .replace(/^(.{8})(.{4})(.{4})(.{4})(.{12})$/, "$1-$2-4$3-$4-$5");
  }

  static isValidUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

  static generate5DigitOTP(): string {
    return Math.floor(10000 + Math.random() * 90000).toString();
  }

  static generate6DigitOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
}
