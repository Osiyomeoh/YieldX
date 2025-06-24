import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { VerificationRecord, VerificationRecordDocument } from '../verification/schemas/verification-record.schema';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(
    @InjectModel(VerificationRecord.name) 
    private verificationModel: Model<VerificationRecordDocument>,
  ) {}

  async getDashboardData() {
    this.logger.log('📊 Generating dashboard data');

    const [
      totalVerifications,
      successfulVerifications,
      avgRiskScore,
      recentVerifications,
      creditRatingDistribution
    ] = await Promise.all([
      this.verificationModel.countDocuments(),
      this.verificationModel.countDocuments({ isValid: true }),
      this.getAverageRiskScore(),
      this.getRecentVerifications(10),
      this.getCreditRatingDistribution(),
    ]);

    const successRate = totalVerifications > 0 
      ? ((successfulVerifications / totalVerifications) * 100).toFixed(2)
      : '0';

    return {
      summary: {
        totalVerifications,
        successfulVerifications,
        failedVerifications: totalVerifications - successfulVerifications,
        successRate: `${successRate}%`,
        averageRiskScore: avgRiskScore,
      },
      recentActivity: recentVerifications,
      creditRatingDistribution,
      lastUpdated: new Date().toISOString(),
    };
  }

  async getVerificationTrends(days: number) {
    this.logger.log(`📈 Analyzing verification trends for ${days} days`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const trends = await this.verificationModel.aggregate([
      {
        $match: {
          verifiedAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: "%Y-%m-%d", date: "$verifiedAt" } }
          },
          total: { $sum: 1 },
          successful: {
            $sum: { $cond: [{ $eq: ["$isValid", true] }, 1, 0] }
          },
          avgRiskScore: { $avg: "$riskScore" }
        }
      },
      {
        $sort: { "_id.date": 1 }
      }
    ]);

    return {
      trends: trends.map(trend => ({
        date: trend._id.date,
        total: trend.total,
        successful: trend.successful,
        failed: trend.total - trend.successful,
        successRate: ((trend.successful / trend.total) * 100).toFixed(2),
        avgRiskScore: trend.avgRiskScore?.toFixed(2) || 0,
      })),
      period: `${days} days`,
    };
  }

  async getRiskDistribution() {
    this.logger.log('⚖️ Analyzing risk score distribution');

    const distribution = await this.verificationModel.aggregate([
      {
        $bucket: {
          groupBy: "$riskScore",
          boundaries: [0, 20, 40, 60, 80, 100],
          default: "100+",
          output: {
            count: { $sum: 1 },
            avgScore: { $avg: "$riskScore" }
          }
        }
      }
    ]);

    const riskCategories = ['Low (0-20)', 'Medium (20-40)', 'High (40-60)', 'Very High (60-80)', 'Critical (80-100)'];

    // Calculate total for percentage
    const totalCount = distribution.reduce((sum, bucket) => sum + bucket.count, 0);

    return {
      distribution: distribution.map((bucket, index) => ({
        category: riskCategories[index] || 'Critical (80+)',
        count: bucket.count,
        avgScore: bucket.avgScore?.toFixed(2) || 0,
        percentage: totalCount > 0 ? ((bucket.count / totalCount) * 100).toFixed(1) + '%' : '0%',
      })),
      totalAnalyzed: totalCount,
    };
  }

  async getCountryAnalysis() {
    this.logger.log('🌍 Analyzing country-wise verification data');

    // Since we don't have country data in the VerificationRecord schema,
    // we'll return mock data for demonstration. In a real implementation,
    // you'd need to store country information in your verification records.
    
    return {
      topSupplierCountries: [
        { country: 'Singapore', verifications: 45, successRate: '95.6%' },
        { country: 'Germany', verifications: 38, successRate: '92.1%' },
        { country: 'Japan', verifications: 32, successRate: '96.9%' },
        { country: 'South Korea', verifications: 28, successRate: '89.3%' },
        { country: 'United Kingdom', verifications: 24, successRate: '91.7%' },
      ],
      topBuyerCountries: [
        { country: 'United States', verifications: 78, successRate: '94.9%' },
        { country: 'Canada', verifications: 34, successRate: '97.1%' },
        { country: 'Australia', verifications: 29, successRate: '93.1%' },
        { country: 'Netherlands', verifications: 22, successRate: '95.5%' },
        { country: 'France', verifications: 19, successRate: '89.5%' },
      ],
      riskByRegion: {
        'North America': { avgRisk: 18.5, verifications: 112 },
        'Europe': { avgRisk: 22.1, verifications: 89 },
        'Asia Pacific': { avgRisk: 19.8, verifications: 143 },
        'Middle East': { avgRisk: 31.2, verifications: 12 },
        'Africa': { avgRisk: 28.9, verifications: 8 },
      },
    };
  }

  async getCommodityAnalysis() {
    this.logger.log('📦 Analyzing commodity-wise verification data');

    // Mock data for commodity analysis
    return {
      topCommodities: [
        { commodity: 'Electronics', verifications: 156, avgRiskScore: 22.5, successRate: '94.2%' },
        { commodity: 'Textiles', verifications: 134, avgRiskScore: 18.7, successRate: '96.3%' },
        { commodity: 'Machinery', verifications: 98, avgRiskScore: 25.1, successRate: '91.8%' },
        { commodity: 'Food Products', verifications: 87, avgRiskScore: 15.3, successRate: '97.7%' },
        { commodity: 'Chemicals', verifications: 72, avgRiskScore: 31.2, successRate: '88.9%' },
      ],
      riskyCommodities: [
        { commodity: 'Precious Metals', avgRiskScore: 67.8, verifications: 12 },
        { commodity: 'Pharmaceuticals', avgRiskScore: 45.2, verifications: 28 },
        { commodity: 'Raw Materials', avgRiskScore: 38.9, verifications: 41 },
      ],
    };
  }

  async getPerformanceMetrics() {
    this.logger.log('⚡ Analyzing performance metrics');

    const [
      avgProcessingTime,
      totalRequests,
      peakHourAnalysis
    ] = await Promise.all([
      this.getAverageProcessingTime(),
      this.verificationModel.countDocuments(),
      this.getPeakHourAnalysis(),
    ]);

    return {
      performance: {
        averageProcessingTime: avgProcessingTime,
        totalRequestsProcessed: totalRequests,
        systemUptime: this.getSystemUptime(),
        peakHours: peakHourAnalysis,
      },
      systemHealth: {
        status: 'healthy',
        lastChecked: new Date().toISOString(),
        memoryUsage: this.getMemoryUsage(),
      },
    };
  }

  // Private helper methods
  private async getAverageRiskScore(): Promise<number> {
    const result = await this.verificationModel.aggregate([
      { $group: { _id: null, avgRisk: { $avg: '$riskScore' } } }
    ]);
    return parseFloat((result[0]?.avgRisk || 0).toFixed(2));
  }

  private async getRecentVerifications(limit: number) {
    return this.verificationModel
      .find()
      .sort({ verifiedAt: -1 })
      .limit(limit)
      .select('verificationId invoiceId isValid riskScore creditRating verifiedAt')
      .exec();
  }

  private async getCreditRatingDistribution() {
    const distribution = await this.verificationModel.aggregate([
      { $group: { _id: '$creditRating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    return distribution.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});
  }

  private async getAverageProcessingTime(): Promise<string> {
    const result = await this.verificationModel.aggregate([
      { $group: { _id: null, avgTime: { $avg: '$processingTimeMs' } } }
    ]);
    
    const avgTimeMs = result[0]?.avgTime || 1000;
    return `${avgTimeMs.toFixed(0)}ms`;
  }

  private async getPeakHourAnalysis() {
    const hourlyData = await this.verificationModel.aggregate([
      {
        $group: {
          _id: { $hour: '$verifiedAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 3 }
    ]);

    return hourlyData.map(item => ({
      hour: `${item._id}:00`,
      requests: item.count
    }));
  }

  private getSystemUptime(): string {
    const uptimeSeconds = process.uptime();
    const hours = Math.floor(uptimeSeconds / 3600);
    const minutes = Math.floor((uptimeSeconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }

  private getMemoryUsage(): string {
    const memUsage = process.memoryUsage();
    const usedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    return `${usedMB}MB / ${totalMB}MB`;
  }

  // Additional analytics methods for comprehensive insights
  async getMonthlyTrends() {
    this.logger.log('📅 Generating monthly trends');

    const monthlyData = await this.verificationModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$verifiedAt' },
            month: { $month: '$verifiedAt' }
          },
          total: { $sum: 1 },
          successful: { $sum: { $cond: [{ $eq: ['$isValid', true] }, 1, 0] } },
          avgRiskScore: { $avg: '$riskScore' }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      },
      {
        $limit: 12 // Last 12 months
      }
    ]);

    return monthlyData.map(month => ({
      month: `${month._id.year}-${month._id.month.toString().padStart(2, '0')}`,
      total: month.total,
      successful: month.successful,
      failed: month.total - month.successful,
      successRate: ((month.successful / month.total) * 100).toFixed(1) + '%',
      avgRiskScore: month.avgRiskScore?.toFixed(1) || '0'
    }));
  }

  async getAlerts() {
    this.logger.log('🚨 Checking for system alerts');

    const [
      highRiskCount,
      recentFailures,
      systemLoad
    ] = await Promise.all([
      this.verificationModel.countDocuments({ 
        riskScore: { $gte: 80 },
        verifiedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      }),
      this.verificationModel.countDocuments({ 
        isValid: false,
        verifiedAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
      }),
      this.getSystemLoad()
    ]);

    const alerts: { type: string; message: string; timestamp: string }[] = [];

    if (highRiskCount > 10) {
      alerts.push({
        type: 'warning',
        message: `High number of high-risk transactions detected: ${highRiskCount} in the last 24 hours`,
        timestamp: new Date().toISOString()
      });
    }

    if (recentFailures > 5) {
      alerts.push({
        type: 'error',
        message: `Increased verification failures: ${recentFailures} in the last hour`,
        timestamp: new Date().toISOString()
      });
    }

    if (systemLoad > 80) {
      alerts.push({
        type: 'warning',
        message: `High system load detected: ${systemLoad}%`,
        timestamp: new Date().toISOString()
      });
    }

    return {
      alerts,
      alertCount: alerts.length,
      lastChecked: new Date().toISOString()
    };
  }

  private async getSystemLoad(): Promise<number> {
    // Simulate system load calculation
    const memUsage = process.memoryUsage();
    const usedHeap = memUsage.heapUsed;
    const totalHeap = memUsage.heapTotal;
    return Math.round((usedHeap / totalHeap) * 100);
  }

  // Export data methods
  async exportVerificationData(startDate: Date, endDate: Date) {
    this.logger.log(`📤 Exporting verification data from ${startDate} to ${endDate}`);

    const data = await this.verificationModel
      .find({
        verifiedAt: { $gte: startDate, $lte: endDate }
      })
      .select('verificationId invoiceId isValid riskScore creditRating verifiedAt processingTimeMs')
      .sort({ verifiedAt: -1 })
      .exec();

    return {
      exportedCount: data.length,
      dateRange: { start: startDate, end: endDate },
      data: data,
      generatedAt: new Date().toISOString()
    };
  }
}