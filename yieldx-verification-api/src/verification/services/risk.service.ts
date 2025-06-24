import { Injectable, Logger } from '@nestjs/common';

interface CommodityRiskRequest {
  commodity: string;
  amount: number;
  supplierCountry: string;
  buyerCountry: string;
}

interface GeographicRiskRequest {
  supplierCountry: string;
  buyerCountry: string;
}

interface RiskResult {
  status: string;
  details: string[];
  riskImpact: number;
  recommendations?: string[];
}

@Injectable()
export class RiskService {
  private readonly logger = new Logger(RiskService.name);

  // High-risk commodities
  private readonly HIGH_RISK_COMMODITIES = [
    'weapons', 'ammunition', 'explosives', 'nuclear materials',
    'rare earth minerals', 'conflict minerals', 'dual-use technology'
  ];

  // Risk countries (simplified for demo)
  private readonly HIGH_RISK_COUNTRIES = [
    'high_risk_region', 'conflict_zone', 'unstable_area'
  ];

  async assessCommodityRisk(request: CommodityRiskRequest): Promise<RiskResult> {
    this.logger.log(`⚖️ Commodity risk assessment: ${request.commodity}`);

    const details: string[] = [];
    let riskImpact = 0;
    let status = 'APPROVED';
    const recommendations: string[] = [];

    // Check if commodity is high-risk
    const isHighRisk = this.HIGH_RISK_COMMODITIES.some(risk => 
      request.commodity.toLowerCase().includes(risk.toLowerCase())
    );

    if (isHighRisk) {
      status = 'HIGH_RISK';
      riskImpact += 35;
      details.push(`High-risk commodity detected: ${request.commodity}`);
      recommendations.push('Enhanced due diligence required');
      recommendations.push('Additional documentation needed');
    } else {
      details.push('Commodity cleared for standard processing');
    }

    // Amount-based risk assessment
    if (request.amount > 1000000) { // > $10M
      riskImpact += 15;
      details.push('Large transaction amount - enhanced oversight applied');
      recommendations.push('Senior management approval required');
    } else if (request.amount > 100000) { // > $1M
      riskImpact += 5;
      details.push('Medium-sized transaction - standard verification applied');
    }

    return {
      status,
      details,
      riskImpact,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  async assessGeographicRisk(request: GeographicRiskRequest): Promise<RiskResult> {
    this.logger.log(`🌍 Geographic risk assessment: ${request.supplierCountry} -> ${request.buyerCountry}`);

    const details: string[] = [];
    let riskImpact = 0;
    const recommendations: string[] = [];

    // Check supplier country risk
    if (this.isHighRiskCountry(request.supplierCountry)) {
      riskImpact += 20;
      details.push(`High-risk supplier country: ${request.supplierCountry}`);
      recommendations.push('Enhanced country risk monitoring');
    }

    // Check buyer country risk
    if (this.isHighRiskCountry(request.buyerCountry)) {
      riskImpact += 20;
      details.push(`High-risk buyer country: ${request.buyerCountry}`);
      recommendations.push('Additional compliance checks required');
    }

    // Cross-border risk assessment
    if (this.isCrossBorderRisk(request.supplierCountry, request.buyerCountry)) {
      riskImpact += 10;
      details.push('Cross-border trade risk factors identified');
      recommendations.push('Enhanced transaction monitoring');
    }

    if (riskImpact === 0) {
      details.push('Low geographic risk assessment');
    }

    return {
      status: riskImpact > 30 ? 'HIGH_RISK' : 'APPROVED',
      details,
      riskImpact,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  assessAmountRisk(amount: number): RiskResult {
    this.logger.log(`💰 Amount risk assessment: $${amount.toLocaleString()}`);

    const details: string[] = [];
    let riskImpact = 0;
    const recommendations: string[] = [];

    if (amount > 5000000) { // > $50M
      riskImpact += 25;
      details.push('Very large transaction - highest oversight level');
      recommendations.push('Board approval required');
      recommendations.push('Enhanced audit trail');
    } else if (amount > 1000000) { // > $10M
      riskImpact += 15;
      details.push('Large transaction - enhanced due diligence');
      recommendations.push('Senior management approval');
    } else if (amount > 100000) { // > $1M
      riskImpact += 5;
      details.push('Medium transaction - standard processing');
    } else {
      details.push('Standard transaction amount');
    }

    // Check for unusual patterns
    if (this.isUnusualAmount(amount)) {
      riskImpact += 10;
      details.push('Unusual amount pattern detected');
      recommendations.push('Additional verification recommended');
    }

    return {
      status: riskImpact > 20 ? 'HIGH_RISK' : 'APPROVED',
      details,
      riskImpact,
      recommendations: recommendations.length > 0 ? recommendations : undefined,
    };
  }

  private isHighRiskCountry(country: string): boolean {
    return this.HIGH_RISK_COUNTRIES.some(risk => 
      country.toLowerCase().includes(risk.toLowerCase())
    );
  }

  private isCrossBorderRisk(supplierCountry: string, buyerCountry: string): boolean {
    // Simplified logic - in real implementation, check against known risk corridors
    return supplierCountry.toLowerCase() !== buyerCountry.toLowerCase();
  }

  private isUnusualAmount(amount: number): boolean {
    // Check for suspiciously round numbers or repeated digits
    const amountStr = amount.toString();
    return amountStr.match(/^(\d)\1+$/) !== null || // All same digits
           amount % 1000000 === 0; // Perfect millions
  }
}
