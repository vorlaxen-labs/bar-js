import { BaRHookEvent } from "../interfaces";

type HookFn = (payload: any) => void;

export class BaRHooks {
    private hooks: Partial<Record<BaRHookEvent, HookFn[]>> = {};

    on(event: BaRHookEvent, fn: HookFn) {
        if (!this.hooks[event]) this.hooks[event] = [];
        this.hooks[event]!.push(fn);
    }

    emit(event: BaRHookEvent, payload: any) {
        this.hooks[event]?.forEach(fn => {
            try {
                fn(payload);
            } catch (err) {
                console.warn(`[BaR] Hook "${event}" threw an error:`, err);
            }
        });
    }
}