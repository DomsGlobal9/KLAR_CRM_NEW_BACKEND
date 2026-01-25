interface IPerformanceMetrics {
    operation: string;
    duration: number;
    startTime: number;
    endTime: number;
    success: boolean;
    metadata?: Record<string, any>;
}

class PerformanceLogger {
    private static instance: PerformanceLogger;
    private metrics: IPerformanceMetrics[] = [];
    private enabled = process.env.NODE_ENV !== 'production';

    private constructor() { }

    static getInstance(): PerformanceLogger {
        if (!PerformanceLogger.instance) {
            PerformanceLogger.instance = new PerformanceLogger();
        }
        return PerformanceLogger.instance;
    }

    async measure<T>(
        operation: string,
        fn: () => Promise<T>,
        metadata?: Record<string, any>
    ): Promise<T> {
        if (!this.enabled) {
            return fn();
        }

        const startTime = Date.now();

        try {
            const result = await fn();
            const endTime = Date.now();

            this.logMetrics({
                operation,
                duration: endTime - startTime,
                startTime,
                endTime,
                success: true,
                metadata
            });

            return result;
        } catch (error: any) {
            const endTime = Date.now();

            this.logMetrics({
                operation,
                duration: endTime - startTime,
                startTime,
                endTime,
                success: false,
                metadata: { ...metadata, error: error.message }
            });

            throw error;
        }
    }

    private logMetrics(metrics: IPerformanceMetrics) {
        this.metrics.push(metrics);

        // Log to console
        const icon = metrics.success ? '✅' : '❌';
        const level = metrics.duration > 1000 ? '🚨' : metrics.duration > 500 ? '⚠️' : '📊';

        console.log(`${icon} ${level} [PERF] ${metrics.operation}: ${metrics.duration}ms`);

        // Keep only last 1000 metrics
        if (this.metrics.length > 1000) {
            this.metrics = this.metrics.slice(-1000);
        }
    }

    getMetrics(operation?: string): IPerformanceMetrics[] {
        if (operation) {
            return this.metrics.filter(m => m.operation === operation);
        }
        return this.metrics;
    }

    getSummary(): Record<string, any> {
        const summary: Record<string, any> = {};

        const grouped = this.metrics.reduce((acc, metric) => {
            if (!acc[metric.operation]) {
                acc[metric.operation] = [];
            }
            acc[metric.operation].push(metric.duration);
            return acc;
        }, {} as Record<string, number[]>);

        Object.keys(grouped).forEach(op => {
            const durations = grouped[op];
            const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
            const max = Math.max(...durations);
            const min = Math.min(...durations);

            summary[op] = {
                calls: durations.length,
                avg: `${avg.toFixed(2)}ms`,
                min: `${min}ms`,
                max: `${max}ms`,
                p95: `${this.percentile(durations, 95).toFixed(2)}ms`,
                p99: `${this.percentile(durations, 99).toFixed(2)}ms`
            };
        });

        return summary;
    }

    private percentile(arr: number[], p: number): number {
        const sorted = [...arr].sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[Math.max(0, index)];
    }

    clear() {
        this.metrics = [];
    }

    enable() {
        this.enabled = true;
    }

    disable() {
        this.enabled = false;
    }
}

export const perfLogger = PerformanceLogger.getInstance();