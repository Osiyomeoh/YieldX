// Create this file: src/verification/dto/minimal-verification-request.dto.ts

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber } from 'class-validator';

export class MinimalVerificationRequestDto {
  @ApiProperty({
    description: 'Invoice ID to verify',
    example: '999',
    type: String
  })
  @IsString()
  invoiceId: string;

  @ApiProperty({
    description: 'Document hash for verification',
    example: 'test_hash_123',
    type: String
  })
  @IsString()
  documentHash: string;

  @ApiPropertyOptional({
    description: 'Commodity being traded',
    example: 'Coffee',
    type: String
  })
  @IsString()
  @IsOptional()
  commodity?: string;

  @ApiPropertyOptional({
    description: 'Trade amount',
    example: 50000,
    type: Number
  })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({
    description: 'Supplier country',
    example: 'Kenya',
    type: String
  })
  @IsString()
  @IsOptional()
  supplierCountry?: string;

  @ApiPropertyOptional({
    description: 'Buyer country',
    example: 'USA',
    type: String
  })
  @IsString()
  @IsOptional()
  buyerCountry?: string;

  @ApiPropertyOptional({
    description: 'Exporter name',
    example: 'Test Exporter',
    type: String
  })
  @IsString()
  @IsOptional()
  exporterName?: string;

  @ApiPropertyOptional({
    description: 'Buyer name',
    example: 'Test Buyer',
    type: String
  })
  @IsString()
  @IsOptional()
  buyerName?: string;
}