import { Logger } from "../interfaces";

export interface BaRContext {
  /**
   * Unique request identifier (trace/correlation id)
   */
  request_id: string;

  /**
   * Request start timestamp (ms)
   */
  start_time: number;

  /**
   * Client IP address
   */
  ip?: string;

  /**
   * User-Agent header
   */
  user_agent?: string;

  /**
   * Authenticated user id (if available)
   */
  user_id?: string;

  /**
   * Optional logger bound to this request
   */
  logger?: Logger;

  /**
   * Arbitrary metadata bag for extensions
   */
  meta?: Record<string, any>;
}