import type { Logger } from "../../src/interfaces";

export const silentLogger: Logger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
};

export function clearSilentLoggerMocks(): void {
  jest.clearAllMocks();
}
