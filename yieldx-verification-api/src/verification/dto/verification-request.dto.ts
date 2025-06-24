import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsObject, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class InvoiceDetailsDto {
  @ApiProperty({ description: 'Commodity being traded', example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  commodity: string;

  @ApiProperty({ description: 'Invoice amount in USD cents', example: '50000000' })
  @IsString()
  @IsNotEmpty()
  amount: string;

  @ApiProperty({ description: 'Supplier country', example: 'Singapore' })
  @IsString()
  @IsNotEmpty()
  supplierCountry: string;

  @ApiProperty({ description: 'Buyer country', example: 'United States' })
  @IsString()
  @IsNotEmpty()
  buyerCountry: string;

  @ApiProperty({ description: 'Exporter company name', example: 'TechFlow Exports Ltd' })
  @IsString()
  @IsNotEmpty()
  exporterName: string;

  @ApiProperty({ description: 'Buyer company name', example: 'American Electronics Corp' })
  @IsString()
  @IsNotEmpty()
  buyerName: string;
}

export class VerificationRequestDto {
  @ApiProperty({ description: 'Unique invoice ID', example: '1' })
  @IsString()
  @IsNotEmpty()
  invoiceId: string;

  @ApiProperty({ description: 'Document hash for verification', example: '0xabcd1234...' })
  @IsString()
  @IsNotEmpty()
  documentHash: string;

  @ApiProperty({ description: 'Invoice details for verification', type: InvoiceDetailsDto })
  @IsObject()
  @ValidateNested()
  @Type(() => InvoiceDetailsDto)
  invoiceDetails: InvoiceDetailsDto;

  @ApiProperty({ description: 'Optional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
