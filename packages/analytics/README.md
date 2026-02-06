# @k-msg/analytics

Analytics and insights engine for the K-Message platform.

## Installation

```bash
npm install @k-msg/analytics @k-msg/core
# or
bun add @k-msg/analytics @k-msg/core
```

## Features

- **Metrics Collection**: Comprehensive message and system metrics collection
- **Real-time Analytics**: Live analytics processing and aggregation
- **Anomaly Detection**: Intelligent anomaly detection for message patterns
- **Recommendation Engine**: AI-powered recommendations for optimization
- **Dashboard Generation**: Automated dashboard and report generation
- **Data Export**: Multiple export formats (CSV, JSON, Excel)

## Basic Usage

```typescript
import { AnalyticsService, MetricsCollector } from '@k-msg/analytics';

const analytics = new AnalyticsService();
const collector = new MetricsCollector();

// Collect message metrics
await collector.collect({
  type: 'MESSAGE_SENT',
  provider: 'iwinv',
  channel: 'alimtalk',
  count: 1,
  metadata: {
    templateId: 'TPL001',
    region: 'KR'
  }
});

// Generate dashboard data
const dashboard = await analytics.generateDashboard({
  timeRange: '24h',
  metrics: ['delivery_rate', 'failure_rate', 'response_time']
});
```

## Insights and Recommendations

```typescript
import { InsightEngine, RecommendationEngine } from '@k-msg/analytics';

const insightEngine = new InsightEngine();
const recommendationEngine = new RecommendationEngine();

// Generate insights
const insights = await insightEngine.generateInsights({
  timeRange: '7d',
  providers: ['iwinv'],
  includeAnomalies: true
});

// Get optimization recommendations
const recommendations = await recommendationEngine.generateRecommendations({
  metrics: insights.metrics,
  thresholds: {
    deliveryRate: 0.95,
    errorRate: 0.05
  }
});
```

## Export and Reporting

```typescript
import { ExportManager } from '@k-msg/analytics';

const exportManager = new ExportManager();

// Export metrics to CSV
await exportManager.exportToCSV({
  metrics: dashboard.metrics,
  filename: 'monthly-report.csv',
  timeRange: '30d'
});

// Export to JSON for API consumption
const jsonReport = await exportManager.exportToJSON({
  includeRawData: true,
  format: 'detailed'
});
```

## License

MIT