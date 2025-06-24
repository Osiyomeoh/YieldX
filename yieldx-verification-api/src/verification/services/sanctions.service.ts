// src/verification/services/sanctions.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

interface SanctionsCheckRequest {
  exporterName: string;
  buyerName: string;
  supplierCountry: string;
  buyerCountry: string;
}

interface SanctionsCheckResult {
  status: 'CLEAR' | 'FLAGGED' | 'ERROR';
  details: string[];
  riskImpact: number;
  flaggedEntities?: string[];
  sanctionsLists?: string[];
  matchConfidence?: number;
}

@Injectable()
export class SanctionsService {
  private readonly logger = new Logger(SanctionsService.name);
  
  // Comprehensive sanctions lists for demo (in production, use real API)
  private readonly SANCTIONED_ENTITIES = [
    // Individual names
    'vladimir putin', 'kim jong un', 'nicolas maduro', 'bashar al-assad',
    'alexander lukashenko', 'ali khamenei', 'ebrahim raisi',
    
    // Organizations
    'rosneft', 'gazprom bank', 'sberbank', 'vtb bank', 'alfa bank',
    'central bank of iran', 'bank of korea', 'venezuela oil company',
    'wagner group', 'islamic revolutionary guard', 'hezbollah',
    
    // Generic indicators for demo
    'sanctioned corp', 'blocked entity', 'denied party', 'restricted company',
    'embargo trading', 'prohibited exports', 'banned imports', 'blacklisted firm'
  ];

  private readonly SANCTIONED_COUNTRIES = [
    // Full embargos
    'north korea', 'dprk', 'iran', 'cuba', 'syria',
    
    // Partial sanctions
    'russia', 'russian federation', 'belarus', 'myanmar', 'burma',
    'venezuela', 'afghanistan', 'somalia', 'central african republic',
    
    // Demo indicators
    'restricted_country', 'sanctioned_nation', 'embargo_zone'
  ];

  private readonly HIGH_RISK_REGIONS = [
    'crimea', 'donetsk', 'luhansk', 'south ossetia', 'abkhazia',
    'gaza strip', 'west bank', 'kashmir', 'xinjiang'
  ];

  // Sanctions lists mapping
  private readonly SANCTIONS_LISTS = {
    'OFAC_SDN': 'US Treasury OFAC Specially Designated Nationals',
    'EU_SANCTIONS': 'European Union Consolidated List',
    'UN_SANCTIONS': 'United Nations Consolidated List',
    'HMT_SANCTIONS': 'UK HM Treasury Financial Sanctions',
    'DFAT_SANCTIONS': 'Australian DFAT Consolidated List',
    'SECO_SANCTIONS': 'Swiss SECO Consolidated List'
  };

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
  ) {}

  async screenEntities(request: SanctionsCheckRequest): Promise<SanctionsCheckResult> {
    this.logger.log(`🔍 Sanctions screening: ${request.exporterName} <-> ${request.buyerName}`);

    try {
      const results = await Promise.all([
        this.checkEntitySanctions(request.exporterName, 'exporter'),
        this.checkEntitySanctions(request.buyerName, 'buyer'),
        this.checkCountrySanctions(request.supplierCountry, 'supplier'),
        this.checkCountrySanctions(request.buyerCountry, 'buyer'),
        this.checkGeographicRisk(request.supplierCountry, request.buyerCountry),
      ]);

      const combinedResult = this.combineResults(results);
      
      // Enhanced risk scoring
      combinedResult.riskImpact = this.calculateRiskScore(combinedResult);
      
      this.logger.log(`✅ Sanctions screening completed: ${combinedResult.status}, Risk: ${combinedResult.riskImpact}`);
      
      return combinedResult;

    } catch (error) {
      this.logger.error(`❌ Sanctions screening error: ${error.message}`);
      return {
        status: 'ERROR',
        details: ['Sanctions screening service temporarily unavailable'],
        riskImpact: 25,
      };
    }
  }

  private async checkEntitySanctions(entityName: string, entityType: string): Promise<Partial<SanctionsCheckResult>> {
    const flaggedLists: string[] = [];
    const details: string[] = [];
    let matchConfidence = 0;

    // Fuzzy matching for entity names
    const normalizedEntity = this.normalizeEntityName(entityName);
    
    for (const sanctionedEntity of this.SANCTIONED_ENTITIES) {
      const confidence = this.calculateSimilarity(normalizedEntity, sanctionedEntity);
      
      if (confidence > 0.8) { // High confidence match
        flaggedLists.push('OFAC_SDN');
        details.push(`${entityType} "${entityName}" matches sanctioned entity with ${(confidence * 100).toFixed(1)}% confidence`);
        matchConfidence = Math.max(matchConfidence, confidence);
      } else if (confidence > 0.6) { // Medium confidence match
        flaggedLists.push('POTENTIAL_MATCH');
        details.push(`${entityType} "${entityName}" potential match with sanctioned entity (${(confidence * 100).toFixed(1)}% confidence)`);
        matchConfidence = Math.max(matchConfidence, confidence * 0.7); // Reduce impact for lower confidence
      }
    }

    // Additional checks for common sanctions indicators
    if (this.hasHighRiskKeywords(normalizedEntity)) {
      flaggedLists.push('KEYWORD_RISK');
      details.push(`${entityType} contains high-risk keywords`);
      matchConfidence = Math.max(matchConfidence, 0.5);
    }

    return {
      status: flaggedLists.length > 0 ? 'FLAGGED' : 'CLEAR',
      details,
      flaggedEntities: flaggedLists.length > 0 ? [entityName] : [],
      sanctionsLists: flaggedLists,
      matchConfidence,
    };
  }

  private async checkCountrySanctions(country: string, entityType: string): Promise<Partial<SanctionsCheckResult>> {
    const normalizedCountry = country.toLowerCase();
    const flaggedLists: string[] = [];
    const details: string[] = [];

    // Check against sanctioned countries
    for (const sanctionedCountry of this.SANCTIONED_COUNTRIES) {
      if (normalizedCountry.includes(sanctionedCountry) || sanctionedCountry.includes(normalizedCountry)) {
        flaggedLists.push('COUNTRY_SANCTIONS');
        details.push(`${entityType} country "${country}" is under international sanctions`);
        break;
      }
    }

    // Check high-risk regions
    for (const riskRegion of this.HIGH_RISK_REGIONS) {
      if (normalizedCountry.includes(riskRegion)) {
        flaggedLists.push('HIGH_RISK_REGION');
        details.push(`${entityType} location "${country}" is in a high-risk region`);
        break;
      }
    }

    return {
      status: flaggedLists.length > 0 ? 'FLAGGED' : 'CLEAR',
      details,
      sanctionsLists: flaggedLists,
    };
  }

  private async checkGeographicRisk(supplierCountry: string, buyerCountry: string): Promise<Partial<SanctionsCheckResult>> {
    const details: string[] = [];
    const flaggedLists: string[] = [];

    // Check for sanctions-busting routes
    const riskyCombinations = [
      { from: 'russia', to: 'china', risk: 'Potential sanctions evasion route' },
      { from: 'iran', to: 'syria', risk: 'High-risk trade corridor' },
      { from: 'north korea', to: 'china', risk: 'Prohibited trade route' },
    ];

    const normalizedSupplier = supplierCountry.toLowerCase();
    const normalizedBuyer = buyerCountry.toLowerCase();

    for (const combination of riskyCombinations) {
      if (normalizedSupplier.includes(combination.from) && normalizedBuyer.includes(combination.to)) {
        flaggedLists.push('TRADE_ROUTE_RISK');
        details.push(`Trade route ${supplierCountry} -> ${buyerCountry}: ${combination.risk}`);
      }
    }

    return {
      status: flaggedLists.length > 0 ? 'FLAGGED' : 'CLEAR',
      details,
      sanctionsLists: flaggedLists,
    };
  }

  private combineResults(results: Partial<SanctionsCheckResult>[]): SanctionsCheckResult {
    const allDetails = results.flatMap(r => r.details || []);
    const allFlaggedEntities = results.flatMap(r => r.flaggedEntities || []);
    const allSanctionsLists = results.flatMap(r => r.sanctionsLists || []);
    const maxConfidence = Math.max(...results.map(r => r.matchConfidence || 0));

    const hasFlags = results.some(r => r.status === 'FLAGGED');
    const hasErrors = results.some(r => r.status === 'ERROR');

    return {
      status: hasFlags ? 'FLAGGED' : hasErrors ? 'ERROR' : 'CLEAR',
      details: allDetails.length > 0 ? allDetails : ['All entities cleared sanctions screening'],
      riskImpact: 0, // Will be calculated later
      flaggedEntities: allFlaggedEntities,
      sanctionsLists: [...new Set(allSanctionsLists)], // Remove duplicates
      matchConfidence: maxConfidence,
    };
  }

  private calculateRiskScore(result: SanctionsCheckResult): number {
    let riskScore = 0;

    if (result.status === 'FLAGGED') {
      // Base risk for any sanctions match
      riskScore += 50;

      // Additional risk based on confidence
      if (result.matchConfidence && result.matchConfidence > 0.8) {
        riskScore += 30; // High confidence match
      } else if (result.matchConfidence && result.matchConfidence > 0.6) {
        riskScore += 20; // Medium confidence match
      }

      // Additional risk based on sanctions lists
      if (result.sanctionsLists?.includes('OFAC_SDN')) riskScore += 25;
      if (result.sanctionsLists?.includes('COUNTRY_SANCTIONS')) riskScore += 20;
      if (result.sanctionsLists?.includes('HIGH_RISK_REGION')) riskScore += 15;
      if (result.sanctionsLists?.includes('TRADE_ROUTE_RISK')) riskScore += 10;
    }

    return Math.min(riskScore, 100); // Cap at 100
  }

  private normalizeEntityName(name: string): string {
    return name.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim();
  }

  private calculateSimilarity(str1: string, str2: string): number {
    // Simple Levenshtein distance-based similarity
    const distance = this.levenshteinDistance(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);
    return maxLength === 0 ? 1 : 1 - distance / maxLength;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private hasHighRiskKeywords(entityName: string): boolean {
    const riskKeywords = ['military', 'defense', 'nuclear', 'weapons', 'arms', 'missile', 'chemical', 'biological'];
    return riskKeywords.some(keyword => entityName.includes(keyword));
  }
}

