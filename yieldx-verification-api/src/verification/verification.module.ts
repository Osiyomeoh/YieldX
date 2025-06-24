import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { VerificationController } from './verification.controller';
import { VerificationService } from './verification.service';
import { SanctionsService } from './services/sanctions.service';
import { FraudService } from './services/fraud.service';
import { RiskService } from './services/risk.service';
import { DocumentService } from './services/document.service';
import { VerificationRecord, VerificationRecordSchema } from './schemas/verification-record.schema';
import { InvoiceData, InvoiceDataSchema } from './schemas/invoice-data.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VerificationRecord.name, schema: VerificationRecordSchema },
      { name: InvoiceData.name, schema: InvoiceDataSchema },
    ]),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
  ],
  controllers: [VerificationController],
  providers: [
    VerificationService,
    SanctionsService,
    FraudService,
    RiskService,
    DocumentService,
  ],
  exports: [VerificationService],
})
export class VerificationModule {}
