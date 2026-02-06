/**
 * Recommendation Engine
 * 데이터 기반 추천 시스템
 */

import type { AggregatedMetric, InsightData } from '../types/analytics.types';
import { MetricType } from '../types/analytics.types';

export interface RecommendationConfig {
  rules: RecommendationRule[];
  enableMachineLearning: boolean;
  confidenceThreshold: number;
  maxRecommendations: number;
  categories: RecommendationCategory[];
}

export interface RecommendationRule {
  id: string;
  name: string;
  category: string;
  priority: number;
  conditions: RuleCondition[];
  actions: RecommendationAction[];
  enabled: boolean;
}

export interface RuleCondition {
  metric: MetricType;
  operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'between' | 'trend';
  value: number | [number, number];
  timeWindow?: string; // '1h', '1d', '1w'
  dimensions?: Record<string, string>;
}

export interface RecommendationAction {
  type: 'optimization' | 'cost-saving' | 'performance' | 'reliability' | 'security';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  steps: string[];
  estimatedBenefit?: {
    metric: MetricType;
    improvement: number;
    unit: string;
  };
}

export interface Recommendation {
  id: string;
  category: string;
  priority: number;
  title: string;
  description: string;
  rationale: string;
  actions: RecommendationAction[];
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  createdAt: Date;
  validUntil?: Date;
  metadata: {
    ruleIds: string[];
    triggeredBy: {
      metrics: { type: MetricType; value: number; timestamp: Date }[];
      conditions: string[];
    };
    estimatedROI?: number;
  };
}

export interface RecommendationCategory {
  id: string;
  name: string;
  description: string;
  weight: number;
}

export class RecommendationEngine {
  private config: RecommendationConfig;
  private recommendations: Map<string, Recommendation> = new Map();
  private ruleExecutionHistory: Map<string, Date[]> = new Map();

  private defaultConfig: RecommendationConfig = {
    rules: [],
    enableMachineLearning: false,
    confidenceThreshold: 0.7,
    maxRecommendations: 10,
    categories: [
      { id: 'cost', name: 'Cost Optimization', description: 'Reduce operational costs', weight: 0.8 },
      { id: 'performance', name: 'Performance', description: 'Improve system performance', weight: 0.9 },
      { id: 'reliability', name: 'Reliability', description: 'Enhance system reliability', weight: 1.0 },
      { id: 'security', name: 'Security', description: 'Strengthen security posture', weight: 0.95 }
    ]
  };

  constructor(config: Partial<RecommendationConfig> = {}) {
    this.config = { ...this.defaultConfig, ...config };
    this.initializeDefaultRules();
  }

  /**
   * 메트릭 기반 추천 생성
   */
  async generateRecommendations(metrics: AggregatedMetric[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // 규칙 기반 추천
    const ruleBasedRecommendations = await this.generateRuleBasedRecommendations(metrics);
    recommendations.push(...ruleBasedRecommendations);

    // 패턴 기반 추천
    const patternBasedRecommendations = await this.generatePatternBasedRecommendations(metrics);
    recommendations.push(...patternBasedRecommendations);

    // 비교 기반 추천
    const comparisonBasedRecommendations = await this.generateComparisonBasedRecommendations(metrics);
    recommendations.push(...comparisonBasedRecommendations);

    // ML 기반 추천 (활성화된 경우)
    if (this.config.enableMachineLearning) {
      const mlRecommendations = await this.generateMLBasedRecommendations(metrics);
      recommendations.push(...mlRecommendations);
    }

    // 중복 제거 및 우선순위 정렬
    const filteredRecommendations = this.deduplicateAndPrioritize(recommendations);

    // 저장
    for (const recommendation of filteredRecommendations) {
      this.recommendations.set(recommendation.id, recommendation);
    }

    return filteredRecommendations.slice(0, this.config.maxRecommendations);
  }

  /**
   * 특정 카테고리 추천 조회
   */
  getRecommendationsByCategory(category: string): Recommendation[] {
    return Array.from(this.recommendations.values())
      .filter(r => r.category === category)
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * 추천 실행 상태 업데이트
   */
  markRecommendationAsImplemented(recommendationId: string): boolean {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) return false;

    // 구현된 추천을 제거하거나 별도 저장소로 이동
    this.recommendations.delete(recommendationId);
    return true;
  }

  /**
   * 추천 무시
   */
  dismissRecommendation(recommendationId: string, reason?: string): boolean {
    const recommendation = this.recommendations.get(recommendationId);
    if (!recommendation) return false;

    // 무시된 추천 처리
    this.recommendations.delete(recommendationId);
    return true;
  }

  /**
   * 추천 통계
   */
  getRecommendationStats(): {
    total: number;
    byCategory: Record<string, number>;
    byImpact: Record<string, number>;
    byPriority: Record<string, number>;
  } {
    const recommendations = Array.from(this.recommendations.values());
    const byCategory: Record<string, number> = {};
    const byImpact: Record<string, number> = {};
    const byPriority: Record<string, number> = {};

    for (const rec of recommendations) {
      byCategory[rec.category] = (byCategory[rec.category] || 0) + 1;
      byImpact[rec.impact] = (byImpact[rec.impact] || 0) + 1;
      
      const priorityLevel = rec.priority >= 8 ? 'high' : rec.priority >= 5 ? 'medium' : 'low';
      byPriority[priorityLevel] = (byPriority[priorityLevel] || 0) + 1;
    }

    return {
      total: recommendations.length,
      byCategory,
      byImpact,
      byPriority
    };
  }

  private async generateRuleBasedRecommendations(metrics: AggregatedMetric[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    for (const rule of this.config.rules) {
      if (!rule.enabled) continue;

      try {
        const matchingMetrics = this.evaluateRuleConditions(rule, metrics);
        
        if (matchingMetrics.length > 0) {
          const recommendation = await this.createRecommendationFromRule(rule, matchingMetrics);
          if (recommendation && recommendation.confidence >= this.config.confidenceThreshold) {
            recommendations.push(recommendation);
            this.recordRuleExecution(rule.id);
          }
        }
      } catch (error) {
        console.error(`Rule execution failed for rule ${rule.id}:`, error);
      }
    }

    return recommendations;
  }

  private async generatePatternBasedRecommendations(metrics: AggregatedMetric[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // 시간 패턴 분석
    const timePatterns = this.analyzeTimePatterns(metrics);
    recommendations.push(...this.generateTimeBasedRecommendations(timePatterns));

    // 채널 사용 패턴 분석
    const channelPatterns = this.analyzeChannelPatterns(metrics);
    recommendations.push(...this.generateChannelBasedRecommendations(channelPatterns));

    // 오류 패턴 분석
    const errorPatterns = this.analyzeErrorPatterns(metrics);
    recommendations.push(...this.generateErrorBasedRecommendations(errorPatterns));

    return recommendations;
  }

  private async generateComparisonBasedRecommendations(metrics: AggregatedMetric[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // 프로바이더 성능 비교
    const providerComparison = this.compareProviderPerformance(metrics);
    recommendations.push(...this.generateProviderRecommendations(providerComparison));

    // 채널 효율성 비교
    const channelComparison = this.compareChannelEfficiency(metrics);
    recommendations.push(...this.generateChannelEfficiencyRecommendations(channelComparison));

    return recommendations;
  }

  private async generateMLBasedRecommendations(metrics: AggregatedMetric[]): Promise<Recommendation[]> {
    // ML 기반 추천 로직 (향후 구현)
    // 현재는 간단한 통계 기반 접근법 사용
    
    const recommendations: Recommendation[] = [];
    
    // 예측 모델을 통한 용량 계획
    const capacityRecommendations = await this.generateCapacityRecommendations(metrics);
    recommendations.push(...capacityRecommendations);

    return recommendations;
  }

  private evaluateRuleConditions(rule: RecommendationRule, metrics: AggregatedMetric[]): AggregatedMetric[] {
    const matchingMetrics: AggregatedMetric[] = [];

    for (const condition of rule.conditions) {
      const relevantMetrics = metrics.filter(m => {
        // 메트릭 타입 확인
        if (m.type !== condition.metric) return false;

        // 차원 필터 확인
        if (condition.dimensions) {
          for (const [key, value] of Object.entries(condition.dimensions)) {
            if (m.dimensions[key] !== value) return false;
          }
        }

        return true;
      });

      // 조건 평가
      for (const metric of relevantMetrics) {
        if (this.evaluateCondition(metric, condition)) {
          matchingMetrics.push(metric);
        }
      }
    }

    return matchingMetrics;
  }

  private evaluateCondition(metric: AggregatedMetric, condition: RuleCondition): boolean {
    const value = metric.aggregations.avg;

    switch (condition.operator) {
      case 'gt': return value > (condition.value as number);
      case 'lt': return value < (condition.value as number);
      case 'gte': return value >= (condition.value as number);
      case 'lte': return value <= (condition.value as number);
      case 'eq': return value === (condition.value as number);
      case 'between': 
        const [min, max] = condition.value as [number, number];
        return value >= min && value <= max;
      case 'trend':
        // 트렌드 조건은 더 복잡한 로직 필요
        return false;
      default:
        return false;
    }
  }

  private async createRecommendationFromRule(
    rule: RecommendationRule,
    matchingMetrics: AggregatedMetric[]
  ): Promise<Recommendation | null> {
    if (rule.actions.length === 0) return null;

    const confidence = this.calculateRuleConfidence(rule, matchingMetrics);
    const impact = this.calculateAggregateImpact(rule.actions);
    const effort = this.calculateAggregateEffort(rule.actions);

    return {
      id: `rule_${rule.id}_${Date.now()}`,
      category: rule.category,
      priority: rule.priority,
      title: rule.name,
      description: `Based on analysis of ${matchingMetrics.length} metrics`,
      rationale: this.generateRationale(rule, matchingMetrics),
      actions: rule.actions,
      confidence,
      impact,
      effort,
      createdAt: new Date(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1주일
      metadata: {
        ruleIds: [rule.id],
        triggeredBy: {
          metrics: matchingMetrics.map(m => ({
            type: m.type,
            value: m.aggregations.avg,
            timestamp: m.timestamp
          })),
          conditions: rule.conditions.map(c => `${c.metric} ${c.operator} ${c.value}`)
        }
      }
    };
  }

  private analyzeTimePatterns(metrics: AggregatedMetric[]): any {
    // 시간별 사용 패턴 분석
    const hourlyUsage = new Map<number, number>();
    const dailyUsage = new Map<number, number>();

    for (const metric of metrics) {
      const hour = metric.timestamp.getHours();
      const dayOfWeek = metric.timestamp.getDay();

      hourlyUsage.set(hour, (hourlyUsage.get(hour) || 0) + metric.aggregations.sum);
      dailyUsage.set(dayOfWeek, (dailyUsage.get(dayOfWeek) || 0) + metric.aggregations.sum);
    }

    return { hourlyUsage, dailyUsage };
  }

  private generateTimeBasedRecommendations(timePatterns: any): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { hourlyUsage, dailyUsage } = timePatterns;

    // 피크 시간 분석
    const peakHour = Array.from(hourlyUsage.entries() as Iterable<[number, number]>).reduce((max: [number, number], curr: [number, number]) => 
      curr[1] > max[1] ? curr : max, [0, 0] as [number, number]
    );

    if (peakHour[1] > 0) {
      recommendations.push({
        id: `time_peak_${Date.now()}`,
        category: 'performance',
        priority: 7,
        title: 'Optimize for Peak Hours',
        description: `Peak usage occurs at ${peakHour[0]}:00. Consider load balancing optimizations.`,
        rationale: 'High traffic concentration during peak hours may impact performance',
        actions: [{
          type: 'performance',
          title: 'Implement Load Balancing',
          description: 'Configure load balancing to distribute traffic during peak hours',
          impact: 'medium',
          effort: 'medium',
          steps: [
            'Set up multiple provider connections',
            'Implement round-robin distribution',
            'Monitor performance during peak hours'
          ]
        }],
        confidence: 0.8,
        impact: 'medium',
        effort: 'medium',
        createdAt: new Date(),
        metadata: {
          ruleIds: [],
          triggeredBy: {
            metrics: [],
            conditions: [`Peak hour usage: ${peakHour[1]} at ${peakHour[0]}:00`]
          }
        }
      });
    }

    return recommendations;
  }

  private analyzeChannelPatterns(metrics: AggregatedMetric[]): any {
    const channelUsage = new Map<string, { sent: number; delivered: number; failed: number }>();

    for (const metric of metrics) {
      const channel = metric.dimensions.channel || 'unknown';
      const stats = channelUsage.get(channel) || { sent: 0, delivered: 0, failed: 0 };

      if (metric.type === MetricType.MESSAGE_SENT) {
        stats.sent += metric.aggregations.sum;
      } else if (metric.type === MetricType.MESSAGE_DELIVERED) {
        stats.delivered += metric.aggregations.sum;
      } else if (metric.type === MetricType.MESSAGE_FAILED) {
        stats.failed += metric.aggregations.sum;
      }

      channelUsage.set(channel, stats);
    }

    return { channelUsage };
  }

  private generateChannelBasedRecommendations(channelPatterns: any): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { channelUsage } = channelPatterns;

    for (const [channel, stats] of channelUsage.entries()) {
      const deliveryRate = stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0;
      const failureRate = stats.sent > 0 ? (stats.failed / stats.sent) * 100 : 0;

      if (deliveryRate < 90 && stats.sent > 100) {
        recommendations.push({
          id: `channel_delivery_${channel}_${Date.now()}`,
          category: 'reliability',
          priority: 8,
          title: `Improve ${channel} Channel Reliability`,
          description: `${channel} channel has ${deliveryRate.toFixed(1)}% delivery rate`,
          rationale: 'Low delivery rate impacts customer experience and wastes resources',
          actions: [{
            type: 'reliability',
            title: 'Investigate Channel Issues',
            description: `Analyze and fix delivery issues for ${channel} channel`,
            impact: 'high',
            effort: 'medium',
            steps: [
              `Review ${channel} provider configuration`,
              'Check template approval status',
              'Analyze failure patterns',
              'Implement fallback mechanisms'
            ]
          }],
          confidence: 0.9,
          impact: 'high',
          effort: 'medium',
          createdAt: new Date(),
          metadata: {
            ruleIds: [],
            triggeredBy: {
              metrics: [],
              conditions: [`${channel} delivery rate: ${deliveryRate.toFixed(1)}%`]
            }
          }
        });
      }
    }

    return recommendations;
  }

  private analyzeErrorPatterns(metrics: AggregatedMetric[]): any {
    const errorsByCode = new Map<string, number>();
    const errorsByProvider = new Map<string, number>();

    for (const metric of metrics) {
      if (metric.type === MetricType.MESSAGE_FAILED) {
        const errorCode = metric.dimensions.errorCode || 'unknown';
        const provider = metric.dimensions.provider || 'unknown';

        errorsByCode.set(errorCode, (errorsByCode.get(errorCode) || 0) + metric.aggregations.sum);
        errorsByProvider.set(provider, (errorsByProvider.get(provider) || 0) + metric.aggregations.sum);
      }
    }

    return { errorsByCode, errorsByProvider };
  }

  private generateErrorBasedRecommendations(errorPatterns: any): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { errorsByCode, errorsByProvider } = errorPatterns;

    // 가장 빈번한 오류 코드 분석
    if (errorsByCode.size > 0) {
      const topError = Array.from(errorsByCode.entries() as Iterable<[string, number]>).reduce((max: [string, number], curr: [string, number]) => 
        curr[1] > max[1] ? curr : max
      );

      if (topError[1] > 10) {
        recommendations.push({
          id: `error_${topError[0]}_${Date.now()}`,
          category: 'reliability',
          priority: 9,
          title: `Address Frequent Error: ${topError[0]}`,
          description: `Error code ${topError[0]} occurred ${topError[1]} times`,
          rationale: 'Frequent errors indicate systematic issues that need attention',
          actions: [{
            type: 'reliability',
            title: 'Fix Recurring Error',
            description: `Investigate and resolve error code ${topError[0]}`,
            impact: 'high',
            effort: 'high',
            steps: [
              'Analyze error logs and patterns',
              'Identify root cause',
              'Implement fix or workaround',
              'Add monitoring for this error type'
            ]
          }],
          confidence: 0.95,
          impact: 'high',
          effort: 'high',
          createdAt: new Date(),
          metadata: {
            ruleIds: [],
            triggeredBy: {
              metrics: [],
              conditions: [`Error ${topError[0]}: ${topError[1]} occurrences`]
            }
          }
        });
      }
    }

    return recommendations;
  }

  private compareProviderPerformance(metrics: AggregatedMetric[]): any {
    const providerStats = new Map<string, { sent: number; delivered: number; avgResponseTime: number }>();

    for (const metric of metrics) {
      const provider = metric.dimensions.provider;
      if (!provider) continue;

      const stats = providerStats.get(provider) || { sent: 0, delivered: 0, avgResponseTime: 0 };

      if (metric.type === MetricType.MESSAGE_SENT) {
        stats.sent += metric.aggregations.sum;
      } else if (metric.type === MetricType.MESSAGE_DELIVERED) {
        stats.delivered += metric.aggregations.sum;
      }

      providerStats.set(provider, stats);
    }

    return { providerStats };
  }

  private generateProviderRecommendations(providerComparison: any): Recommendation[] {
    const recommendations: Recommendation[] = [];
    const { providerStats } = providerComparison;

    const providers = Array.from(providerStats.entries() as Iterable<[string, { sent: number; delivered: number; avgResponseTime: number }]>).map(([provider, stats]) => ({
      provider,
      deliveryRate: stats.sent > 0 ? (stats.delivered / stats.sent) * 100 : 0,
      volume: stats.sent
    }));

    if (providers.length > 1) {
      const bestProvider = providers.reduce((best: { provider: string; deliveryRate: number; volume: number }, curr: { provider: string; deliveryRate: number; volume: number }) => 
        curr.deliveryRate > best.deliveryRate ? curr : best
      );

      const worstProvider = providers.reduce((worst: { provider: string; deliveryRate: number; volume: number }, curr: { provider: string; deliveryRate: number; volume: number }) => 
        curr.deliveryRate < worst.deliveryRate ? curr : worst
      );

      if (bestProvider.deliveryRate - worstProvider.deliveryRate > 10) {
        recommendations.push({
          id: `provider_optimization_${Date.now()}`,
          category: 'cost',
          priority: 6,
          title: 'Optimize Provider Usage',
          description: `${bestProvider.provider} has ${bestProvider.deliveryRate.toFixed(1)}% delivery rate vs ${worstProvider.provider} at ${worstProvider.deliveryRate.toFixed(1)}%`,
          rationale: 'Shifting traffic to better-performing providers can improve delivery rates and reduce costs',
          actions: [{
            type: 'optimization',
            title: 'Rebalance Provider Traffic',
            description: 'Increase traffic to high-performing providers',
            impact: 'medium',
            effort: 'low',
            steps: [
              `Reduce traffic allocation to ${worstProvider.provider}`,
              `Increase traffic allocation to ${bestProvider.provider}`,
              'Monitor performance changes',
              'Adjust allocation based on results'
            ]
          }],
          confidence: 0.85,
          impact: 'medium',
          effort: 'low',
          createdAt: new Date(),
          metadata: {
            ruleIds: [],
            triggeredBy: {
              metrics: [],
              conditions: [
                `${bestProvider.provider}: ${bestProvider.deliveryRate.toFixed(1)}%`,
                `${worstProvider.provider}: ${worstProvider.deliveryRate.toFixed(1)}%`
              ]
            }
          }
        });
      }
    }

    return recommendations;
  }

  private compareChannelEfficiency(metrics: AggregatedMetric[]): any {
    // 채널별 효율성 비교 로직
    return {};
  }

  private generateChannelEfficiencyRecommendations(channelComparison: any): Recommendation[] {
    return [];
  }

  private async generateCapacityRecommendations(metrics: AggregatedMetric[]): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = [];

    // 간단한 용량 예측 (실제로는 더 정교한 ML 모델 사용)
    const messageSentMetrics = metrics.filter(m => m.type === MetricType.MESSAGE_SENT);
    
    if (messageSentMetrics.length > 0) {
      const recentVolume = messageSentMetrics
        .filter(m => m.timestamp > new Date(Date.now() - 24 * 60 * 60 * 1000))
        .reduce((sum, m) => sum + m.aggregations.sum, 0);

      const historicalAverage = messageSentMetrics
        .reduce((sum, m) => sum + m.aggregations.sum, 0) / messageSentMetrics.length;

      if (recentVolume > historicalAverage * 1.5) {
        recommendations.push({
          id: `capacity_scale_${Date.now()}`,
          category: 'performance',
          priority: 7,
          title: 'Consider Capacity Scaling',
          description: `Recent volume (${recentVolume}) is 50% above historical average (${historicalAverage.toFixed(0)})`,
          rationale: 'Sustained high volume may require additional capacity',
          actions: [{
            type: 'performance',
            title: 'Scale Infrastructure',
            description: 'Prepare for increased load by scaling infrastructure',
            impact: 'high',
            effort: 'high',
            steps: [
              'Monitor system resource utilization',
              'Prepare additional provider connections',
              'Review rate limiting configurations',
              'Plan for peak capacity scenarios'
            ]
          }],
          confidence: 0.75,
          impact: 'high',
          effort: 'high',
          createdAt: new Date(),
          metadata: {
            ruleIds: [],
            triggeredBy: {
              metrics: [],
              conditions: [`Recent volume: ${recentVolume}, Historical average: ${historicalAverage.toFixed(0)}`]
            }
          }
        });
      }
    }

    return recommendations;
  }

  private calculateRuleConfidence(rule: RecommendationRule, matchingMetrics: AggregatedMetric[]): number {
    // 조건 만족도와 데이터 품질을 기반으로 신뢰도 계산
    const baseConfidence = 0.5;
    const dataQualityBonus = Math.min(0.3, matchingMetrics.length / 10);
    const priorityBonus = rule.priority / 10 * 0.2;

    return Math.min(0.99, baseConfidence + dataQualityBonus + priorityBonus);
  }

  private calculateAggregateImpact(actions: RecommendationAction[]): 'low' | 'medium' | 'high' {
    const impactScores = { low: 1, medium: 2, high: 3 };
    const avgScore = actions.reduce((sum, action) => sum + impactScores[action.impact], 0) / actions.length;
    
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
  }

  private calculateAggregateEffort(actions: RecommendationAction[]): 'low' | 'medium' | 'high' {
    const effortScores = { low: 1, medium: 2, high: 3 };
    const avgScore = actions.reduce((sum, action) => sum + effortScores[action.effort], 0) / actions.length;
    
    if (avgScore >= 2.5) return 'high';
    if (avgScore >= 1.5) return 'medium';
    return 'low';
  }

  private generateRationale(rule: RecommendationRule, matchingMetrics: AggregatedMetric[]): string {
    const metricSummary = matchingMetrics.length > 0 
      ? `Based on ${matchingMetrics.length} metrics showing concerning patterns`
      : 'Based on rule evaluation';
    
    return `${metricSummary}. ${rule.name} conditions have been met, indicating potential optimization opportunities.`;
  }

  private recordRuleExecution(ruleId: string): void {
    const history = this.ruleExecutionHistory.get(ruleId) || [];
    history.push(new Date());
    
    // 최근 100개 실행 기록만 유지
    if (history.length > 100) {
      history.splice(0, history.length - 100);
    }
    
    this.ruleExecutionHistory.set(ruleId, history);
  }

  private deduplicateAndPrioritize(recommendations: Recommendation[]): Recommendation[] {
    // 유사한 추천 제거
    const uniqueRecommendations = new Map<string, Recommendation>();
    
    for (const rec of recommendations) {
      const key = `${rec.category}_${rec.title}`;
      
      if (!uniqueRecommendations.has(key) || 
          uniqueRecommendations.get(key)!.confidence < rec.confidence) {
        uniqueRecommendations.set(key, rec);
      }
    }

    // 우선순위 및 신뢰도 기준 정렬
    return Array.from(uniqueRecommendations.values())
      .sort((a, b) => {
        if (a.priority !== b.priority) return b.priority - a.priority;
        return b.confidence - a.confidence;
      });
  }

  private initializeDefaultRules(): void {
    this.config.rules.push(
      {
        id: 'low-delivery-rate',
        name: 'Low Delivery Rate Alert',
        category: 'reliability',
        priority: 9,
        conditions: [
          { metric: MetricType.DELIVERY_RATE, operator: 'lt', value: 90 }
        ],
        actions: [{
          type: 'reliability',
          title: 'Improve Delivery Rate',
          description: 'Investigate and fix delivery rate issues',
          impact: 'high',
          effort: 'medium',
          steps: [
            'Check provider API status',
            'Review template approval status',
            'Validate recipient phone numbers',
            'Consider switching providers'
          ]
        }],
        enabled: true
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate Warning',
        category: 'reliability',
        priority: 8,
        conditions: [
          { metric: MetricType.ERROR_RATE, operator: 'gt', value: 10 }
        ],
        actions: [{
          type: 'reliability',
          title: 'Reduce Error Rate',
          description: 'Address high error rates',
          impact: 'high',
          effort: 'high',
          steps: [
            'Analyze error patterns',
            'Fix common error causes',
            'Implement better error handling',
            'Add monitoring and alerts'
          ]
        }],
        enabled: true
      },
      {
        id: 'cost-optimization-sms',
        name: 'SMS to AlimTalk Migration',
        category: 'cost',
        priority: 6,
        conditions: [
          { metric: MetricType.CHANNEL_USAGE, operator: 'gt', value: 1000, dimensions: { channel: 'sms' } }
        ],
        actions: [{
          type: 'cost-saving',
          title: 'Migrate to AlimTalk',
          description: 'Switch eligible SMS messages to AlimTalk for cost savings',
          impact: 'medium',
          effort: 'medium',
          steps: [
            'Identify AlimTalk-eligible messages',
            'Create AlimTalk templates',
            'Implement fallback logic',
            'Monitor cost savings'
          ],
          estimatedBenefit: {
            metric: MetricType.MESSAGE_SENT,
            improvement: 30,
            unit: 'percent cost reduction'
          }
        }],
        enabled: true
      }
    );
  }
}