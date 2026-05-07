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
}