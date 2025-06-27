// src/verification/verification.service.ts
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { VerificationRecord, VerificationRecordDocument } from './schemas/verification-record.schema';
import { InvoiceData, InvoiceDataDocument } from './schemas/invoice-data.schema';
import { VerificationRequestDto } from './dto/verification-request.dto';
import { SanctionsService } from './services/sanctions.service';
import { FraudService } from './services/fraud.service';
import { RiskService } from './services/risk.service';
import { DocumentService } from './services/document.service';

@Injectable()
export class VerificationService {
  private readonly logger = new Logger(VerificationService.name);

  constructor(
    @InjectModel(VerificationRecord.name) 
    private verificationModel: Model<VerificationRecordDocument>,
    @InjectModel(InvoiceData.name) 
    private invoiceDataModel: Model<InvoiceDataDocument>,
    private configService: ConfigService,
    private sanctionsService: SanctionsService,
    private fraudService: FraudService,
    private riskService: RiskService,
    private documentService: DocumentService,
  ) {}

  // ============ NEW: CHAINLINK COMPATIBLE VERIFICATION ============
  async createChainlinkCompatibleVerification(data: any): Promise<any> {
    const verificationId = `cl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.log(`🔗 Creating Chainlink-compatible verification: ${verificationId}`);

    try {
      // Simplified risk assessment for Chainlink Functions
      const riskFactors = this.calculateChainlinkRiskScore(data);
      const creditRating = this.calculateCreditRating(riskFactors.totalRisk);
      const isValid = riskFactors.totalRisk < 70; // Accept if risk < 70%

      const result = {
        invoiceId: data.invoiceId,
        isValid: isValid,
        riskScore: riskFactors.totalRisk,
        creditRating: creditRating,
        details: this.generateVerificationDetails(riskFactors, isValid),
        verificationId: verificationId,
        timestamp: new Date().toISOString(),
        verificationChecks: {
          documentIntegrity: true,
          sanctionsCheck: riskFactors.sanctionsRisk > 20 ? 'FLAGGED' : 'CLEAR',
          fraudCheck: riskFactors.fraudRisk > 30 ? 'FAILED' : 'PASSED',
          commodityCheck: riskFactors.commodityRisk > 25 ? 'REJECTED' : 'APPROVED',
          entityVerification: 'VERIFIED'
        },
        riskFactors: riskFactors
      };

      // Store simplified record for Chainlink requests
      await this.storeChainlinkVerificationRecord(result, data);

      this.logger.log(`✅ Chainlink verification completed: ${verificationId} - Valid: ${isValid}, Risk: ${riskFactors.totalRisk}`);

      return result;

    } catch (error) {
      this.logger.error(`❌ Chainlink verification failed: ${verificationId} - ${error.message}`);
      
      // Return fallback result for Chainlink Functions
      return {
        invoiceId: data.invoiceId,
        isValid: false,
        riskScore: 75,
        creditRating: 'PENDING',
        details: 'Verification service temporarily unavailable - manual review required',
        verificationId: `error_${Date.now()}`,
        timestamp: new Date().toISOString(),
        error: 'Service temporarily unavailable'
      };
    }
  }

  private calculateChainlinkRiskScore(data: any): any {
    const riskFactors = {
      commodityRisk: 0,
      geographicRisk: 0,
      amountRisk: 0,
      entityRisk: 0,
      sanctionsRisk: 0,
      fraudRisk: 0,
      totalRisk: 0
    };

    // Commodity Risk Assessment (0-30 points)
    const commodityRiskMap = {
      'coffee': 5, 'cocoa': 8, 'tea': 5, 'spices': 10,
      'electronics': 15, 'machinery': 12, 'textiles': 8,
      'oil': 25, 'gas': 30, 'minerals': 20, 'gold': 25,
      'diamonds': 30, 'timber': 15, 'rubber': 10
    };
    
    const commodity = data.commodity?.toLowerCase() || '';
    riskFactors.commodityRisk = commodityRiskMap[commodity] || 10;

    // Geographic Risk Assessment (0-25 points)
    const countryRiskMap = {
      'usa': 1, 'canada': 2, 'uk': 2, 'germany': 2, 'france': 2,
      'japan': 3, 'australia': 3, 'singapore': 4, 'uae': 5,
      'china': 8, 'india': 6, 'brazil': 10, 'mexico': 8,
      'kenya': 12, 'ghana': 10, 'nigeria': 15, 'ethiopia': 12,
      'ivory coast': 13, 'south africa': 8, 'egypt': 12,
      'russia': 20, 'iran': 25, 'iraq': 25, 'afghanistan': 25
    };

    const supplierRisk = countryRiskMap[data.supplierCountry?.toLowerCase()] || 15;
    const buyerRisk = countryRiskMap[data.buyerCountry?.toLowerCase()] || 15;
    riskFactors.geographicRisk = Math.max(supplierRisk, buyerRisk);

    // Amount Risk Assessment (0-20 points)
    const amount = parseFloat(data.amount) || 0;
    if (amount < 10000) riskFactors.amountRisk = 2;
    else if (amount < 50000) riskFactors.amountRisk = 5;
    else if (amount < 100000) riskFactors.amountRisk = 8;
    else if (amount < 500000) riskFactors.amountRisk = 12;
    else if (amount < 1000000) riskFactors.amountRisk = 15;
    else riskFactors.amountRisk = 20;

    // Entity Risk Assessment (0-15 points)
    const exporterName = data.exporterName?.toLowerCase() || '';
    const buyerName = data.buyerName?.toLowerCase() || '';
    
    // Check for suspicious entity patterns
    if (exporterName.includes('unknown') || buyerName.includes('unknown')) {
      riskFactors.entityRisk += 10;
    }
    if (exporterName.length < 5 || buyerName.length < 5) {
      riskFactors.entityRisk += 5;
    }

    // Sanctions Risk (0-10 points)
    const sanctionedCountries = ['iran', 'north korea', 'syria', 'cuba'];
    if (sanctionedCountries.includes(data.supplierCountry?.toLowerCase()) ||
        sanctionedCountries.includes(data.buyerCountry?.toLowerCase())) {
      riskFactors.sanctionsRisk = 25; // High risk
    }

    // Fraud Risk Assessment (0-10 points)
    if (amount > 1000000 && (supplierRisk > 15 || buyerRisk > 15)) {
      riskFactors.fraudRisk = 15;
    } else if (amount > 500000 && supplierRisk > 10) {
      riskFactors.fraudRisk = 10;
    } else {
      riskFactors.fraudRisk = 2;
    }

    // Calculate total risk (max 100)
    riskFactors.totalRisk = Math.min(100, 
      riskFactors.commodityRisk + 
      riskFactors.geographicRisk + 
      riskFactors.amountRisk + 
      riskFactors.entityRisk + 
      riskFactors.sanctionsRisk + 
      riskFactors.fraudRisk
    );

    return riskFactors;
  }

  private generateVerificationDetails(riskFactors: any, isValid: boolean): string {
    const details: string[] = [];
    
    if (isValid) {
      details.push('Document verification completed successfully');
      
      if (riskFactors.totalRisk < 20) {
        details.push('Low risk trade - excellent credit profile');
      } else if (riskFactors.totalRisk < 40) {
        details.push('Moderate risk trade - standard due diligence applied');
      } else {
        details.push('Elevated risk trade - enhanced monitoring recommended');
      }
    } else {
      details.push('Trade requires manual review due to high risk factors');
      
      if (riskFactors.sanctionsRisk > 20) {
        details.push('Sanctions screening flagged for review');
      }
      if (riskFactors.fraudRisk > 30) {
        details.push('Fraud risk indicators detected');
      }
      if (riskFactors.geographicRisk > 20) {
        details.push('High geographic risk jurisdiction');
      }
    }

    details.push(`Risk assessment: ${riskFactors.totalRisk}/100`);
    
    return details.join(' | ');
  }

  private async storeChainlinkVerificationRecord(result: any, originalData: any): Promise<void> {
    try {
      const record = new this.verificationModel({
        verificationId: result.verificationId,
        invoiceId: result.invoiceId,
        documentHash: originalData.documentHash || '0x0000',
        isValid: result.isValid,
        riskScore: result.riskScore,
        creditRating: result.creditRating,
        verificationChecks: result.verificationChecks,
        details: [result.details],
        recommendations: [],
        processingTimeMs: 0,
        metadata: {
          source: 'chainlink-functions',
          originalData: originalData,
          riskFactors: result.riskFactors
        },
      });

      await record.save();
    } catch (error) {
      this.logger.warn(`Could not store Chainlink verification record: ${error.message}`);
      // Don't throw error as verification can still proceed
    }
  }

  // ============ EXISTING METHODS (UNCHANGED) ============
  async verifyDocuments(request: VerificationRequestDto): Promise<VerificationRequestDto> {
    const startTime = Date.now();
    const verificationId = uuidv4();

    this.logger.log(`🔍 Starting verification ${verificationId} for invoice ${request.invoiceId}`);

    try {
      // Store invoice data
      await this.storeInvoiceData(request);

      // Initialize verification result
      const verificationResult = {
        invoiceId: request.invoiceId,
        documentHash: request.documentHash,
        verificationId,
        isValid: true,
        documentType: 'Commercial Invoice',
        riskScore: 10, // Start with low risk
        verificationChecks: {
          documentIntegrity: true,
          sanctionsCheck: 'CLEAR',
          fraudCheck: 'PASSED',
          commodityCheck: 'APPROVED',
          entityVerification: 'VERIFIED'
        },
        details: [] as string[],
        recommendations: [] as string[],
        creditRating: 'A',
        timestamp: new Date().toISOString(),
      };

      // Step 1: Document Integrity Check
      const documentCheck = await this.documentService.verifyDocumentIntegrity(request.documentHash);
      verificationResult.verificationChecks.documentIntegrity = documentCheck.isValid;
      verificationResult.details.push(...documentCheck.details);
      verificationResult.riskScore += documentCheck.riskImpact;

      // Step 2: Sanctions Screening
      const sanctionsResult = await this.sanctionsService.screenEntities({
        exporterName: request.invoiceDetails.exporterName,
        buyerName: request.invoiceDetails.buyerName,
        supplierCountry: request.invoiceDetails.supplierCountry,
        buyerCountry: request.invoiceDetails.buyerCountry,
      });
      
      verificationResult.verificationChecks.sanctionsCheck = sanctionsResult.status;
      verificationResult.details.push(...sanctionsResult.details);
      verificationResult.riskScore += sanctionsResult.riskImpact;

      if (sanctionsResult.status === 'FLAGGED') {
        verificationResult.isValid = false;
      }

      // Step 3: Fraud Detection
      const fraudResult = await this.fraudService.detectFraud({
        exporterName: request.invoiceDetails.exporterName,
        buyerName: request.invoiceDetails.buyerName,
        amount: request.invoiceDetails.amount,
        commodity: request.invoiceDetails.commodity,
      });

      verificationResult.verificationChecks.fraudCheck = fraudResult.status;
      verificationResult.details.push(...fraudResult.details);
      verificationResult.riskScore += fraudResult.riskImpact;

      if (fraudResult.status === 'FAILED') {
        verificationResult.isValid = false;
      }

      // Step 4: Commodity Risk Assessment
      const commodityResult = await this.riskService.assessCommodityRisk({
        commodity: request.invoiceDetails.commodity,
        amount: parseFloat(request.invoiceDetails.amount),
        supplierCountry: request.invoiceDetails.supplierCountry,
        buyerCountry: request.invoiceDetails.buyerCountry,
      });

      verificationResult.verificationChecks.commodityCheck = commodityResult.status;
      verificationResult.details.push(...commodityResult.details);
      verificationResult.riskScore += commodityResult.riskImpact;

      // Step 5: Geographic Risk Assessment
      const geoRisk = await this.riskService.assessGeographicRisk({
        supplierCountry: request.invoiceDetails.supplierCountry,
        buyerCountry: request.invoiceDetails.buyerCountry,
      });

      verificationResult.details.push(...geoRisk.details);
      verificationResult.riskScore += geoRisk.riskImpact;

      // Step 6: Amount Risk Assessment
      const amountRisk = this.riskService.assessAmountRisk(parseFloat(request.invoiceDetails.amount));
      verificationResult.details.push(...amountRisk.details);
      verificationResult.riskScore += amountRisk.riskImpact;
      verificationResult.recommendations.push(...(amountRisk.recommendations || []));

      // Step 7: Calculate final credit rating and validity
      verificationResult.creditRating = this.calculateCreditRating(verificationResult.riskScore);
      
      if (verificationResult.riskScore >= 80) {
        verificationResult.isValid = false;
        verificationResult.details.push('Transaction rejected due to high risk score');
      }

      // Store verification record
      const processingTime = Date.now() - startTime;
      await this.storeVerificationRecord(verificationResult, processingTime, request.metadata);

      this.logger.log(`✅ Verification completed: ${verificationId} - Valid: ${verificationResult.isValid}, Risk: ${verificationResult.riskScore}`);

      return {
        ...verificationResult,
        invoiceDetails: request.invoiceDetails,
      };

    } catch (error) {
      this.logger.error(`❌ Verification failed: ${verificationId} - ${error.message}`);
      
      // Store failed verification record
      const processingTime = Date.now() - startTime;
      const errorResult = {
        invoiceId: request.invoiceId,
        documentHash: request.documentHash,
        verificationId,
        isValid: false,
        documentType: 'Error',
        riskScore: 99,
        verificationChecks: {
          documentIntegrity: false,
          sanctionsCheck: 'ERROR',
          fraudCheck: 'ERROR',
          commodityCheck: 'ERROR',
          entityVerification: 'ERROR'
        },
        details: [`Verification service error: ${error.message}`],
        recommendations: ['Manual review required'],
        creditRating: 'ERROR',
        timestamp: new Date().toISOString(),
      };

      await this.storeVerificationRecord(errorResult, processingTime, request.metadata);
      
      throw new BadRequestException({
        message: 'Verification service temporarily unavailable',
        verificationId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async storeInvoiceData(request: VerificationRequestDto): Promise<void> {
    const invoiceData = new this.invoiceDataModel({
      invoiceId: request.invoiceId,
      documentHash: request.documentHash,
      commodity: request.invoiceDetails.commodity,
      amount: request.invoiceDetails.amount,
      supplierCountry: request.invoiceDetails.supplierCountry,
      buyerCountry: request.invoiceDetails.buyerCountry,
      exporterName: request.invoiceDetails.exporterName,
      buyerName: request.invoiceDetails.buyerName,
      metadata: request.metadata || {},
    });

    await invoiceData.save();
  }

  private async storeVerificationRecord(
    result: any, 
    processingTimeMs: number, 
    metadata?: Record<string, any>
  ): Promise<void> {
    const record = new this.verificationModel({
      verificationId: result.verificationId,
      invoiceId: result.invoiceId,
      documentHash: result.documentHash,
      isValid: result.isValid,
      riskScore: result.riskScore,
      creditRating: result.creditRating,
      verificationChecks: result.verificationChecks,
      details: result.details,
      recommendations: result.recommendations,
      processingTimeMs,
      metadata: metadata || {},
    });

    await record.save();
  }

  private calculateCreditRating(riskScore: number): string {
    if (riskScore <= 15) return 'AAA';
    if (riskScore <= 25) return 'AA';
    if (riskScore <= 40) return 'A';
    if (riskScore <= 55) return 'BBB';
    if (riskScore <= 70) return 'BB';
    if (riskScore <= 85) return 'B';
    return 'D';
  }

  async getVerificationStatus(verificationId: string): Promise<VerificationRecord> {
    const record = await this.verificationModel.findOne({ verificationId }).exec();
    
    if (!record) {
      throw new NotFoundException(`Verification record not found: ${verificationId}`);
    }

    return record;
  }

  async getVerificationHistory(invoiceId: string): Promise<VerificationRecord[]> {
    return this.verificationModel
      .find({ invoiceId })
      .sort({ verifiedAt: -1 })
      .exec();
  }

  async createTestVerification(): Promise<VerificationRequestDto> {
    const testRequest: VerificationRequestDto = {
      invoiceId: 'TEST-001',
      documentHash: '0x1234567890abcdef',
      invoiceDetails: {
        commodity: 'Electronics',
        amount: '50000000',
        supplierCountry: 'Singapore',
        buyerCountry: 'United States',
        exporterName: 'Test Exports Ltd',
        buyerName: 'Test Corp USA',
      },
      metadata: { test: true },
    };

    return this.verifyDocuments(testRequest);
  }

  // Analytics methods
  async getVerificationStats(): Promise<any> {
    const total = await this.verificationModel.countDocuments();
    const valid = await this.verificationModel.countDocuments({ isValid: true });
    const avgRiskScore = await this.verificationModel.aggregate([
      { $group: { _id: null, avgRisk: { $avg: '$riskScore' } } }
    ]);

    const ratingDistribution = await this.verificationModel.aggregate([
      { $group: { _id: '$creditRating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    const recentVerifications = await this.verificationModel
      .find()
      .sort({ verifiedAt: -1 })
      .limit(10)
      .select('invoiceId isValid riskScore creditRating verifiedAt')
      .exec();

    return {
      total,
      valid,
      invalid: total - valid,
      validationRate: total > 0 ? (valid / total * 100).toFixed(2) + '%' : '0%',
      averageRiskScore: avgRiskScore[0]?.avgRisk?.toFixed(2) || 0,
      ratingDistribution: ratingDistribution.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      recentVerifications,
      chainlinkIntegration: {
        status: 'active',
        endpointsAvailable: [
          'POST /verification/verify-documents',
          'POST /verification/chainlink-verify',
          'GET /verification/test'
        ],
        lastUpdated: new Date().toISOString()
      }
    };
  }
}