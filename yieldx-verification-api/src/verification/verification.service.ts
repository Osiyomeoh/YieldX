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
    };
  }
}