export interface IBaRDispatcher {
  dispatch(result: BaRFinalResult): any;
}

export interface CookieOptions {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
}

export interface BaRCookie {
  name: string;
  value: string;
  options?: CookieOptions;
}

import type { ResponseError } from "./IResponse.interface";

export interface BaRFinalResult {
  body: {
    success: boolean;
    message?: string;
    data: any;
    timestamp: string;
    metadata: any;
    error?: ResponseError;
  };
  statusCode: number;
  headers: Record<string, any>;
  cookies: BaRCookie[];
}