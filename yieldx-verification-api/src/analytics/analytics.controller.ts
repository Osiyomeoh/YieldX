// src/analytics/analytics.controller.ts
import { 
    Controller, 
    Get, 
    Query, 
    UseGuards, 
    UseInterceptors,
    ParseIntPipe,
    ValidationPipe 
  } from '@nestjs/common';
  import { CacheInterceptor } from '@nestjs/cache-manager';
  import { ThrottlerGuard } from '@nestjs/throttler';
  import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
  import { AnalyticsService } from './analytics.service';
  
  @ApiTags('Analytics')
  @Controller('analytics')  // ✅ Fixed: Removed duplicate api/v1 prefix
  @UseGuards(ThrottlerGuard)
  @UseInterceptors(CacheInterceptor)
  export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) {}
  
    @Get('dashboard')
    @ApiOperation({ summary: 'Get comprehensive dashboard analytics' })
    @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
    async getDashboard() {
      return this.analyticsService.getDashboardData();
    }
  
    @Get('verification-trends')
    @ApiOperation({ summary: 'Get verification trends over time' })
    @ApiQuery({ name: 'days', required: false, type: Number, description: 'Number of days to analyze (default: 30)' })
    @ApiResponse({ status: 200, description: 'Verification trends retrieved successfully' })
    async getVerificationTrends(
      @Query('days', new ParseIntPipe({ optional: true })) days: number = 30
    ) {
      return this.analyticsService.getVerificationTrends(days);
    }
  
    @Get('risk-distribution')
    @ApiOperation({ summary: 'Get risk score distribution' })
    @ApiResponse({ status: 200, description: 'Risk distribution retrieved successfully' })
    async getRiskDistribution() {
      return this.analyticsService.getRiskDistribution();
    }
  
    @Get('country-analysis')
    @ApiOperation({ summary: 'Get country-wise verification analysis' })
    @ApiResponse({ status: 200, description: 'Country analysis retrieved successfully' })
    async getCountryAnalysis() {
      return this.analyticsService.getCountryAnalysis();
    }
  
    @Get('commodity-analysis')
    @ApiOperation({ summary: 'Get commodity risk analysis' })
    @ApiResponse({ status: 200, description: 'Commodity analysis retrieved successfully' })
    async getCommodityAnalysis() {
      return this.analyticsService.getCommodityAnalysis();
    }
  
    @Get('performance-metrics')
    @ApiOperation({ summary: 'Get system performance metrics' })
    @ApiResponse({ status: 200, description: 'Performance metrics retrieved successfully' })
    async getPerformanceMetrics() {
      return this.analyticsService.getPerformanceMetrics();
    }
  
    @Get('monthly-trends')
    @ApiOperation({ summary: 'Get monthly verification trends' })
    @ApiQuery({ name: 'months', required: false, type: Number, description: 'Number of months to analyze (default: 12)' })
    @ApiResponse({ status: 200, description: 'Monthly trends retrieved successfully' })
    async getMonthlyTrends(
      @Query('months', new ParseIntPipe({ optional: true })) months: number = 12
    ) {
      return this.analyticsService.getMonthlyTrends(months);
    }
  
    @Get('alerts')
    @ApiOperation({ summary: 'Get real-time system alerts' })
    @ApiResponse({ status: 200, description: 'System alerts retrieved successfully' })
    async getAlerts() {
      return this.analyticsService.getAlerts();
    }
  
    @Get('export')
    @ApiOperation({ summary: 'Export analytics data' })
    @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Start date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'endDate', required: false, type: String, description: 'End date (YYYY-MM-DD)' })
    @ApiQuery({ name: 'format', required: false, type: String, description: 'Export format (json, csv)' })
    @ApiResponse({ status: 200, description: 'Data exported successfully' })
    async exportData(
      @Query('startDate') startDate?: string,
      @Query('endDate') endDate?: string,
      @Query('format') format: string = 'json'
    ) {
      return this.analyticsService.exportData(startDate, endDate, format);
    }
  }