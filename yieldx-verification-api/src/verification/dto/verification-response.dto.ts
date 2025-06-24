import { ApiProperty } from '@nestjs/swagger';

export class VerificationChecksDto {
  @ApiProperty({ description: 'Document integrity check result' })
  documentIntegrity: boolean;

  @ApiProperty({ description: 'Sanctions screening result', enum: ['CLEAR', 'FLAGGED', 'ERROR'] })
  sanctionsCheck: string;

  @ApiProperty({ description: 'Fraud detection result', enum: ['PASSED', 'FAILED', 'ERROR'] })
  fraudCheck: string;

  @ApiProperty({ description: 'Commodity risk assessment', enum: ['APPROVED', 'HIGH_RISK', 'RESTRICTED'] })
  commodityCheck: string;

  @ApiProperty({ description: 'Entity verification result', enum: ['VERIFIED', 'SUSPICIOUS', 'ERROR'] })
  entityVerification: string;
}

export class VerificationResponseDto {
  @ApiProperty({ description: 'Invoice ID' })
  invoiceId: string;

  @ApiProperty({ description: 'Document hash' })
  documentHash: string;

  @ApiProperty({ description: 'Overall verification result' })
  isValid: boolean;

  @ApiProperty({ description: 'Document type identified' })
  documentType: string;

  @ApiProperty({ description: 'Risk score (1-100, lower is better)' })
  riskScore: number;

  @ApiProperty({ description: 'Detailed verification checks', type: VerificationChecksDto })
  verificationChecks: VerificationChecksDto;

  @ApiProperty({ description: 'Verification details array' })
  details: string[];

  @ApiProperty({ description: 'Credit rating assigned', enum: ['AAA', 'AA', 'A', 'BBB', 'BB', 'B', 'ERROR'] })
  creditRating: string;

  @ApiProperty({ description: 'Recommendations for processing' })
  recommendations: string[];

  @ApiProperty({ description: 'Verification timestamp' })
  timestamp: string;

  @ApiProperty({ description: 'Unique verification ID' })
  verificationId: string;

  @ApiProperty({ description: 'Processing time' })
  processingTime: string;
}
