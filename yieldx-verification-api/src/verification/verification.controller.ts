import { 
    Controller, 
    Post, 
    Get, 
    Body, 
    Param, 
    HttpCode, 
    HttpStatus,
    UseGuards,
    UseInterceptors,
    Logger
  } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';
import { 
    ApiTags, 
    ApiOperation, 
    ApiResponse, 
    ApiParam,
    ApiBearerAuth,
    ApiHeader 
  } from '@nestjs/swagger';
  import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
  import { VerificationService } from './verification.service';
  import { VerificationRequestDto } from './dto/verification-request.dto';
  
  @ApiTags('verification')
  @Controller('verification')
  @UseGuards(ThrottlerGuard)
  @UseInterceptors(CacheInterceptor)
  export class VerificationController {
    private readonly logger = new Logger(VerificationController.name);
  
    constructor(private readonly verificationService: VerificationService) {}
  
    @Post('verify-documents')
    @HttpCode(HttpStatus.OK)
    @Throttle(10, 60) // 10 requests per minute
    @ApiOperation({ 
      summary: 'Verify trade documents',
      description: 'Comprehensive verification of trade finance documents including sanctions screening, fraud detection, and risk assessment'
    })
    @ApiResponse({ 
      status: 200, 
      description: 'Verification completed successfully',
      type: VerificationRequestDto 
    })
    @ApiResponse({ status: 400, description: 'Invalid request data' })
    @ApiResponse({ status: 429, description: 'Too many requests' })
    @ApiResponse({ status: 500, description: 'Internal server error' })
    @ApiHeader({
      name: 'X-API-Key',
      description: 'API key for authentication',
      required: false,
    })
    async verifyDocuments(@Body() request: VerificationRequestDto): Promise<any> {
      this.logger.log(`📄 Document verification request for invoice: ${request.invoiceId}`);
      
      const startTime = Date.now();
      
      try {
        const result = await this.verificationService.verifyDocuments(request);
        const processingTime = Date.now() - startTime;
        
        this.logger.log(`✅ Verification completed for invoice ${request.invoiceId} in ${processingTime}ms`);
        
        return {
          ...result,
          processingTime: `${processingTime}ms`,
        };
      } catch (error) {
        const processingTime = Date.now() - startTime;
        this.logger.error(`❌ Verification failed for invoice ${request.invoiceId}: ${error.message}`);
        
        throw error;
      }
    }
  
    @Get('status/:verificationId')
    @ApiOperation({ 
      summary: 'Get verification status',
      description: 'Retrieve the status and details of a verification request'
    })
    @ApiParam({ name: 'verificationId', description: 'Unique verification ID' })
    @ApiResponse({ status: 200, description: 'Verification status retrieved' })
    @ApiResponse({ status: 404, description: 'Verification not found' })
    async getVerificationStatus(@Param('verificationId') verificationId: string) {
      this.logger.log(`🔍 Status check for verification: ${verificationId}`);
      return this.verificationService.getVerificationStatus(verificationId);
    }
  
    @Get('history/:invoiceId')
    @ApiOperation({ 
      summary: 'Get verification history',
      description: 'Retrieve all verification attempts for a specific invoice'
    })
    @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
    @ApiResponse({ status: 200, description: 'Verification history retrieved' })
    async getVerificationHistory(@Param('invoiceId') invoiceId: string) {
      this.logger.log(`📋 History request for invoice: ${invoiceId}`);
      return this.verificationService.getVerificationHistory(invoiceId);
    }
  
    @Post('test-verify')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ 
      summary: 'Test verification endpoint',
      description: 'Test endpoint for development and debugging'
    })
    @ApiResponse({ status: 200, description: 'Test verification completed' })
    async testVerification() {
      this.logger.log('🧪 Test verification request');
      return this.verificationService.createTestVerification();
    }
  }