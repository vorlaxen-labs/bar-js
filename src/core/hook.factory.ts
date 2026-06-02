import { BaRHookEvent } from "../interfaces";
import { Logger } from "../interfaces/IResponse.interface";

type HookFn = (payload: unknown) => void;

export class BaRHooks {
  private hooks: Partial<Record<BaRHookEvent, HookFn[]>> = {};
  private emittingError = false;

  constructor(private readonly logger?: Logger) {}

  on(event: BaRHookEvent, fn: HookFn) {
    if (!this.hooks[event]) this.hooks[event] = [];
    this.hooks[event]!.push(fn);
  }

  hasListeners(event: BaRHookEvent): boolean {
    return (this.hooks[event]?.length ?? 0) > 0;
  }

  emit(event: BaRHookEvent, payload: unknown) {
    const fns = this.hooks[event];
    if (!fns?.length) return;

    for (const fn of fns) {
      try {
        fn(payload);
      } catch (err) {
        this.logger?.warn?.(`[BaR] Hook "${event}" threw an error`, err);

        if (event === "error" || this.emittingError) {
          console.warn(`[BaR] Hook "${event}" threw an error:`, err);
          continue;
        }

        this.emittingError = true;
        try {
          this.emit("error", { sourceEvent: event, error: err, payload });
        } finally {
          this.emittingError = false;
        }
      }
    }
  }
}
