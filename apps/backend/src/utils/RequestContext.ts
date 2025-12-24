import { AsyncLocalStorage } from 'async_hooks';

export interface RequestStore {
    requestId: string;
}

export class RequestContext {
    private static storage = new AsyncLocalStorage<RequestStore>();

    /**
     * Run a function within a request context
     */
    static runWithRequestId<T>(requestId: string, fn: () => T): T {
        return this.storage.run({ requestId }, fn);
    }

    /**
     * Get the current requestId from context
     */
    static getRequestId(): string | undefined {
        return this.storage.getStore()?.requestId;
    }
}
