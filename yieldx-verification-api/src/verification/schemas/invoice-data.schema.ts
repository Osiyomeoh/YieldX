import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type InvoiceDataDocument = InvoiceData & Document;

@Schema({ timestamps: true })
export class InvoiceData {
  @Prop({ required: true })
  invoiceId: string;

  @Prop({ required: true })
  documentHash: string;

  @Prop({ required: true })
  commodity: string;

  @Prop({ required: true })
  amount: string;

  @Prop({ required: true })
  supplierCountry: string;

  @Prop({ required: true })
  buyerCountry: string;

  @Prop({ required: true })
  exporterName: string;

  @Prop({ required: true })
  buyerName: string;

  @Prop({ type: Object })
  metadata: Record<string, any>;

  @Prop({ default: Date.now })
  submittedAt: Date;
}

export const InvoiceDataSchema = SchemaFactory.createForClass(InvoiceData);