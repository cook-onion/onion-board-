// src/utils/performance.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number[]> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.recordMetric(label, duration);
    };
  }

  recordMetric(label: string, value: number): void {
    if (!this.metrics.has(label)) {
      this.metrics.set(label, []);
    }
    const values = this.metrics.get(label)!;
    values.push(value);

    // 只保留最近100个记录
    if (values.length > 100) {
      values.shift();
    }
  }

  getAverageMetric(label: string): number {
    const values = this.metrics.get(label);
    if (!values || values.length === 0) return 0;

    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  getAllMetrics(): Record<string, { average: number; count: number }> {
    const result: Record<string, { average: number; count: number }> = {};

    for (const [label, values] of this.metrics.entries()) {
      result[label] = {
        average: this.getAverageMetric(label),
        count: values.length,
      };
    }

    return result;
  }

  logMetrics(): void {
    console.table(this.getAllMetrics());
  }
}

// 装饰器函数用于自动监控函数性能
export function measurePerformance(label?: string) {
  return function (
    target: any,
    propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;
    const monitor = PerformanceMonitor.getInstance();

    descriptor.value = function (...args: any[]) {
      const stopTimer = monitor.startTimer(
        label || `${target.constructor.name}.${propertyName}`
      );

      try {
        const result = method.apply(this, args);

        if (result instanceof Promise) {
          return result.finally(() => stopTimer());
        } else {
          stopTimer();
          return result;
        }
      } catch (error) {
        stopTimer();
        throw error;
      }
    };
  };
}
