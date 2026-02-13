/**
 * Rate limiter for API calls
 */

export class RateLimiter {
    private requests: number[] = [];

    constructor(
        private maxRequests: number,
        private windowMs: number
    ) { }

    async acquire(): Promise<void> {
        const now = Date.now();

        this.requests = this.requests.filter(time => now - time < this.windowMs);

        if (this.requests.length >= this.maxRequests) {
            const oldestRequest = Math.min(...this.requests);
            const waitTime = this.windowMs - (now - oldestRequest);

            if (waitTime > 0) {
                await new Promise(resolve => setTimeout(resolve, waitTime));
                return this.acquire();
            }
        }

        this.requests.push(now);
    }

    canMakeRequest(): boolean {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        return this.requests.length < this.maxRequests;
    }

    getRemainingRequests(): number {
        const now = Date.now();
        this.requests = this.requests.filter(time => now - time < this.windowMs);
        return Math.max(0, this.maxRequests - this.requests.length);
    }
}
