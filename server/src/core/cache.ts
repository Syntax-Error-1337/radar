export class Cache<T> {
    private data: T | null = null;
    private lastFetch: number = 0;
    private ttlMs: number;

    constructor(ttlMs: number) {
        this.ttlMs = ttlMs;
    }

    get(): T | null {
        if (this.data && Date.now() - this.lastFetch < this.ttlMs) {
            return this.data;
        }
        return null;
    }

    set(value: T) {
        this.data = value;
        this.lastFetch = Date.now();
    }
}
