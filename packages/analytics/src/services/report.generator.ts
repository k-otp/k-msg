import type { 
  AnalyticsConfig, 
  AnalyticsReport, 
  ReportMetric,
  AggregatedMetric 
} from '../types/analytics.types';
import { MetricType } from '../types/analytics.types';

export class ReportGenerator {
  private config: AnalyticsConfig;

  constructor(config: AnalyticsConfig) {
    this.config = config;
  }

  /**
   * 일일 요약 보고서 생성
   */
  async generateDailySummary(date: Date): Promise<AnalyticsReport> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const previousDay = new Date(startOfDay);
    previousDay.setDate(previousDay.getDate() - 1);

    return this.generateReport({
      id: `daily_${date.toISOString().split('T')[0]}`,
      name: `Daily Summary - ${date.toISOString().split('T')[0]}`,
      description: 'Daily messaging performance summary',
      dateRange: { start: startOfDay, end: endOfDay },
      filters: {},
      metrics: await this.calculateDailyMetrics(startOfDay, endOfDay, previousDay),
      generatedAt: new Date(),
      format: 'json',
    });
  }

  /**
   * 주간 보고서 생성
   */
  async generateWeeklyReport(weekStartDate: Date): Promise<AnalyticsReport> {
    const weekEnd = new Date(weekStartDate);
    weekEnd.setDate(weekEnd.getDate() + 6);

    const previousWeekStart = new Date(weekStartDate);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    return this.generateReport({
      id: `weekly_${weekStartDate.toISOString().split('T')[0]}`,
      name: `Weekly Report - Week of ${weekStartDate.toISOString().split('T')[0]}`,
      description: 'Weekly messaging performance analysis',
      dateRange: { start: weekStartDate, end: weekEnd },
      filters: {},
      metrics: await this.calculateWeeklyMetrics(weekStartDate, weekEnd, previousWeekStart),
      generatedAt: new Date(),
      format: 'json',
    });
  }

  /**
   * 월간 보고서 생성
   */
  async generateMonthlyReport(year: number, month: number): Promise<AnalyticsReport> {
    const monthStart = new Date(year, month - 1, 1);
    const monthEnd = new Date(year, month, 0);
    
    const previousMonthStart = new Date(year, month - 2, 1);
    const previousMonthEnd = new Date(year, month - 1, 0);

    return this.generateReport({
      id: `monthly_${year}_${month.toString().padStart(2, '0')}`,
      name: `Monthly Report - ${year}-${month.toString().padStart(2, '0')}`,
      description: 'Monthly messaging performance analysis',
      dateRange: { start: monthStart, end: monthEnd },
      filters: {},
      metrics: await this.calculateMonthlyMetrics(monthStart, monthEnd, previousMonthStart, previousMonthEnd),
      generatedAt: new Date(),
      format: 'json',
    });
  }

  /**
   * 프로바이더별 성능 보고서
   */
  async generateProviderReport(providerId: string, dateRange: { start: Date; end: Date }): Promise<AnalyticsReport> {
    return this.generateReport({
      id: `provider_${providerId}_${dateRange.start.toISOString().split('T')[0]}`,
      name: `Provider Performance - ${providerId}`,
      description: `Performance analysis for provider ${providerId}`,
      dateRange,
      filters: { provider: providerId },
      metrics: await this.calculateProviderMetrics(providerId, dateRange),
      generatedAt: new Date(),
      format: 'json',
    });
  }

  /**
   * 템플릿 사용량 보고서
   */
  async generateTemplateUsageReport(dateRange: { start: Date; end: Date }): Promise<AnalyticsReport> {
    return this.generateReport({
      id: `template_usage_${dateRange.start.toISOString().split('T')[0]}`,
      name: 'Template Usage Report',
      description: 'Analysis of template usage and performance',
      dateRange,
      filters: {},
      metrics: await this.calculateTemplateMetrics(dateRange),
      generatedAt: new Date(),
      format: 'json',
    });
  }

  /**
   * 커스텀 보고서 생성
   */
  async generateCustomReport(
    name: string,
    dateRange: { start: Date; end: Date },
    filters: Record<string, any>,
    metricTypes: MetricType[]
  ): Promise<AnalyticsReport> {
    return this.generateReport({
      id: `custom_${Date.now()}`,
      name,
      description: 'Custom analytics report',
      dateRange,
      filters,
      metrics: await this.calculateCustomMetrics(dateRange, filters, metricTypes),
      generatedAt: new Date(),
      format: 'json',
    });
  }

  /**
   * 보고서를 CSV 형식으로 내보내기
   */
  async exportToCSV(report: AnalyticsReport): Promise<string> {
    const headers = ['Metric Type', 'Value', 'Change (%)', 'Trend'];
    const rows = report.metrics.map(metric => [
      metric.type.toString(),
      metric.value.toString(),
      metric.change?.toFixed(2) || '0',
      metric.trend || 'stable',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * 보고서를 JSON 형식으로 내보내기
   */
  async exportToJSON(report: AnalyticsReport): Promise<string> {
    return JSON.stringify(report, null, 2);
  }

  private async generateReport(reportData: AnalyticsReport): Promise<AnalyticsReport> {
    // 보고서 유효성 검사
    this.validateReport(reportData);

    // 메트릭 정렬 (중요도 순)
    reportData.metrics.sort((a, b) => {
      const priority = this.getMetricPriority(a.type) - this.getMetricPriority(b.type);
      return priority;
    });

    return reportData;
  }

  private async calculateDailyMetrics(
    startDate: Date, 
    endDate: Date, 
    previousDate: Date
  ): Promise<ReportMetric[]> {
    const metrics: ReportMetric[] = [];

    // 주요 KPI 계산
    const totalSent = await this.getMetricValue(MetricType.MESSAGE_SENT, startDate, endDate);
    const totalDelivered = await this.getMetricValue(MetricType.MESSAGE_DELIVERED, startDate, endDate);
    const totalFailed = await this.getMetricValue(MetricType.MESSAGE_FAILED, startDate, endDate);
    const totalClicked = await this.getMetricValue(MetricType.MESSAGE_CLICKED, startDate, endDate);

    // 이전 기간 데이터
    const previousStart = new Date(previousDate);
    const previousEnd = new Date(previousDate);
    previousEnd.setHours(23, 59, 59, 999);

    const prevSent = await this.getMetricValue(MetricType.MESSAGE_SENT, previousStart, previousEnd);
    
    metrics.push({
      type: MetricType.MESSAGE_SENT,
      value: totalSent,
      change: this.calculateChange(totalSent, prevSent),
      trend: this.calculateTrend(totalSent, prevSent),
    });

    if (totalSent > 0) {
      const deliveryRate = (totalDelivered / totalSent) * 100;
      const errorRate = (totalFailed / totalSent) * 100;
      
      // 이전 기간 데이터
      const prevDelivered = await this.getMetricValue(MetricType.MESSAGE_DELIVERED, previousStart, previousEnd);
      const prevFailed = await this.getMetricValue(MetricType.MESSAGE_FAILED, previousStart, previousEnd);
      const prevDeliveryRate = prevSent > 0 ? (prevDelivered / prevSent) * 100 : 0;
      const prevErrorRate = prevSent > 0 ? (prevFailed / prevSent) * 100 : 0;
      
      metrics.push({
        type: MetricType.DELIVERY_RATE,
        value: deliveryRate,
        change: this.calculateChange(deliveryRate, prevDeliveryRate),
        trend: this.calculateTrend(deliveryRate, prevDeliveryRate),
      });

      metrics.push({
        type: MetricType.ERROR_RATE,
        value: errorRate,
        change: this.calculateChange(errorRate, prevErrorRate),
        trend: this.calculateTrend(errorRate, prevErrorRate),
      });
    }

    if (totalDelivered > 0) {
      const clickRate = (totalClicked / totalDelivered) * 100;
      
      // 이전 기간 클릭률 계산
      const prevClicked = await this.getMetricValue(MetricType.MESSAGE_CLICKED, previousStart, previousEnd);
      const prevDelivered = await this.getMetricValue(MetricType.MESSAGE_DELIVERED, previousStart, previousEnd);
      const prevClickRate = prevDelivered > 0 ? (prevClicked / prevDelivered) * 100 : 0;
      
      metrics.push({
        type: MetricType.CLICK_RATE,
        value: clickRate,
        change: this.calculateChange(clickRate, prevClickRate),
        trend: this.calculateTrend(clickRate, prevClickRate),
      });
    }

    return metrics;
  }

  private async calculateWeeklyMetrics(
    weekStart: Date,
    weekEnd: Date,
    previousWeekStart: Date
  ): Promise<ReportMetric[]> {
    // 주간 메트릭 계산 로직
    return this.calculateDailyMetrics(weekStart, weekEnd, previousWeekStart);
  }

  private async calculateMonthlyMetrics(
    monthStart: Date,
    monthEnd: Date,
    previousMonthStart: Date,
    previousMonthEnd: Date
  ): Promise<ReportMetric[]> {
    // 월간 메트릭 계산 로직
    return this.calculateDailyMetrics(monthStart, monthEnd, previousMonthStart);
  }

  private async calculateProviderMetrics(
    providerId: string,
    dateRange: { start: Date; end: Date }
  ): Promise<ReportMetric[]> {
    const metrics: ReportMetric[] = [];

    // 프로바이더별 성능 메트릭 계산
    const performance = await this.getProviderPerformance(providerId, dateRange);
    
    metrics.push({
      type: MetricType.PROVIDER_PERFORMANCE,
      value: performance.averageResponseTime,
      breakdown: {
        'Success Rate': performance.successRate,
        'Error Rate': performance.errorRate,
        'Avg Response Time': performance.averageResponseTime,
      },
    });

    return metrics;
  }

  private async calculateTemplateMetrics(
    dateRange: { start: Date; end: Date }
  ): Promise<ReportMetric[]> {
    const metrics: ReportMetric[] = [];

    // 템플릿 사용량 분석
    const templateUsage = await this.getTemplateUsage(dateRange);
    
    metrics.push({
      type: MetricType.TEMPLATE_USAGE,
      value: templateUsage.totalUsage,
      breakdown: templateUsage.byTemplate,
    });

    return metrics;
  }

  private async calculateCustomMetrics(
    dateRange: { start: Date; end: Date },
    filters: Record<string, any>,
    metricTypes: MetricType[]
  ): Promise<ReportMetric[]> {
    const metrics: ReportMetric[] = [];

    for (const type of metricTypes) {
      const value = await this.getMetricValue(type, dateRange.start, dateRange.end, filters);
      
      // 이전 기간 동일 기간 데이터
      const previousStart = new Date(dateRange.start);
      const previousEnd = new Date(dateRange.end);
      const daysDiff = (dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24);
      
      previousStart.setDate(previousStart.getDate() - daysDiff);
      previousEnd.setDate(previousEnd.getDate() - daysDiff);
      
      const previousValue = await this.getMetricValue(type, previousStart, previousEnd, filters);
      
      metrics.push({
        type,
        value,
        change: this.calculateChange(value, previousValue),
        trend: this.calculateTrend(value, previousValue),
      });
    }

    return metrics;
  }

  private async getMetricValue(
    type: MetricType,
    start: Date,
    end: Date,
    filters?: Record<string, any>
  ): Promise<number> {
    // 실제 구현에서는 데이터베이스 쿼리
    // 여기서는 임시 값 반환
    return Math.floor(Math.random() * 10000);
  }

  private async getProviderPerformance(providerId: string, dateRange: { start: Date; end: Date }) {
    return {
      successRate: 95.5,
      errorRate: 4.5,
      averageResponseTime: 250, // ms
    };
  }

  private async getTemplateUsage(dateRange: { start: Date; end: Date }) {
    return {
      totalUsage: 5000,
      byTemplate: {
        'auth_otp': 2000,
        'welcome': 1500,
        'notification': 1000,
        'others': 500,
      },
    };
  }

  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }

  private calculateTrend(current: number, previous: number): 'up' | 'down' | 'stable' {
    const change = this.calculateChange(current, previous);
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'up' : 'down';
  }

  private getMetricPriority(type: MetricType): number {
    const priorities = {
      [MetricType.MESSAGE_SENT]: 1,
      [MetricType.DELIVERY_RATE]: 2,
      [MetricType.ERROR_RATE]: 3,
      [MetricType.CLICK_RATE]: 4,
      [MetricType.MESSAGE_DELIVERED]: 5,
      [MetricType.MESSAGE_FAILED]: 6,
      [MetricType.MESSAGE_CLICKED]: 7,
      [MetricType.TEMPLATE_USAGE]: 8,
      [MetricType.PROVIDER_PERFORMANCE]: 9,
      [MetricType.CHANNEL_USAGE]: 10,
    };

    return priorities[type] || 99;
  }

  private validateReport(report: AnalyticsReport): void {
    if (!report.id) {
      throw new Error('Report ID is required');
    }

    if (!report.name) {
      throw new Error('Report name is required');
    }

    if (!report.dateRange || !report.dateRange.start || !report.dateRange.end) {
      throw new Error('Valid date range is required');
    }

    if (report.dateRange.start >= report.dateRange.end) {
      throw new Error('Invalid date range: start must be before end');
    }
  }
}