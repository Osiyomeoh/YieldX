import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type VerificationRecordDocument = VerificationRecord & Document;

@Schema({ timestamps: true })
export class VerificationRecord {
  @ApiProperty()
  @Prop({ required: true, unique: true })
  verificationId: string;

  @ApiProperty()
  @Prop({ required: true })
  invoiceId: string;

  @ApiProperty()
  @Prop({ required: true })
  documentHash: string;

  @ApiProperty()
  @Prop({ required: true })
  isValid: boolean;

  @ApiProperty()
  @Prop({ required: true })
  riskScore: number;

  @ApiProperty()
  @Prop({ required: true })
  creditRating: string;

  @ApiProperty()
  @Prop({ type: Object })
  verificationChecks: {
    documentIntegrity: boolean;
    sanctionsCheck: string;
    fraudCheck: string;
    commodityCheck: string;
    entityVerification: string;
  };

  @ApiProperty()
  @Prop([String])
  details: string[];

  @ApiProperty()
  @Prop([String])
  recommendations: string[];

  @ApiProperty()
  @Prop()
  processingTimeMs: number;

  @ApiProperty()
  @Prop({ type: Object })
  metadata: Record<string, any>;

  @ApiProperty()
  @Prop({ default: Date.now })
  verifiedAt: Date;
}

export const VerificationRecordSchema = SchemaFactory.createForClass(VerificationRecord);
