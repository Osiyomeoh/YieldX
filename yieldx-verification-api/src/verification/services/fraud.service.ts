import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

interface FraudCheckRequest {
  exporterName: string;
  buyerName: string;
  amount: string;
  commodity: string;
  supplierCountry?: string;
  buyerCountry?: string;
}

interface FraudCheckResult {
  status: 'PASSED' | 'FAILED' | 'ERROR';
  details: string[];
  riskImpact: number;
  suspiciousIndicators?: string[];
  fraudScore?: number;
  riskFactors?: string[];
}

@Injectable()
export class FraudService {
  private readonly logger = new Logger(FraudService.name);

  // Known fraudulent patterns and entities
  private readonly FRAUD_INDICATORS = [
    'fraud', 'scam', 'fake', 'suspicious', 'shell company', 'money laundering',
    'ponzi', 'pyramid', 'phishing', 'identity theft', 'stolen', 'counterfeit',
    'embezzlement', 'forgery', 'racketeering', 'bribery', 'corruption'
  ];

  private readonly HIGH_RISK_ENTITIES = [
    'quick cash', 'instant money', 'guaranteed profit', 'risk free',
    'offshore holdings', 'anonymous corp', 'bearer shares', 'shell entity',
    'front company', 'nominee director', 'ghost company'
  ];

  private readonly SUSPICIOUS_COMMODITIES = [
    'weapons', 'drugs', 'narcotics', 'stolen goods', 'counterfeit goods',
    'illegal wildlife', 'conflict minerals', 'blood diamonds', 'human trafficking',
    'organ trafficking', 'child labor products'
  ];

  constructor(private httpService: HttpService) {}

  async detectFraud(request: FraudCheckRequest): Promise<FraudCheckResult> {
    this.logger.log(`🕵️ Fraud detection: ${request.exporterName} -> ${request.buyerName}, Amount: $${request.amount}`);

    try {
      const fraudScore = await this.calculateFraudScore(request);
      const suspiciousIndicators = this.identifyRiskFactors(request);
      const amountRisk = this.analyzeAmountPatterns(parseFloat(request.amount));
      const entityRisk = this.analyzeEntityRisk(request.exporterName, request.buyerName);
      const commodityRisk = this.analyzeCommodityRisk(request.commodity);

      const allIndicators = [
        ...suspiciousIndicators,
        ...amountRisk.indicators,
        ...entityRisk.indicators,
        ...commodityRisk.indicators
      ];

      const totalRiskScore = fraudScore + amountRisk.score + entityRisk.score + commodityRisk.score;
      
      const details = [
        `Fraud analysis completed with score: ${totalRiskScore.toFixed(1)}/100`,
        ...allIndicators.map(indicator => `⚠️ ${indicator}`)
      ];

      if (totalRiskScore < 30) {
        details.unshift('✅ Low fraud risk detected');
      } else if (totalRiskScore < 60) {
        details.unshift('⚠️ Medium fraud risk detected');
      } else {
        details.unshift('🚨 High fraud risk detected');
      }

      const result: FraudCheckResult = {
        status: totalRiskScore >= 70 ? 'FAILED' : 'PASSED',
        details,
        riskImpact: Math.min(totalRiskScore, 100),
        suspiciousIndicators: allIndicators,
        fraudScore: totalRiskScore,
        riskFactors: this.categorizeRiskFactors(allIndicators),
      };

      this.logger.log(`✅ Fraud detection completed: ${result.status}, Score: ${totalRiskScore.toFixed(1)}`);
      return result;

    } catch (error) {
      this.logger.error(`❌ Fraud detection error: ${error.message}`);
      return {
        status: 'ERROR',
        details: ['Fraud detection service temporarily unavailable'],
        riskImpact: 20,
      };
    }
  }

  private async calculateFraudScore(request: FraudCheckRequest): Promise<number> {
    let score = 0;

    // Entity name analysis
    score += this.analyzeEntityNames(request.exporterName, request.buyerName);
    
    // Transaction pattern analysis
    score += this.analyzeTransactionPattern(request);
    
    // Geographic risk
    if (request.supplierCountry && request.buyerCountry) {
      score += this.analyzeGeographicRisk(request.supplierCountry, request.buyerCountry);
    }

    return Math.min(score, 60); // Base fraud score cap
  }

  private analyzeEntityNames(exporterName: string, buyerName: string): number {
    let score = 0;
    
    // Check for fraud indicators in names
    const exporterRisk = this.getNameRiskScore(exporterName);
    const buyerRisk = this.getNameRiskScore(buyerName);
    
    score += Math.max(exporterRisk, buyerRisk);

    // Check for suspicious similarities (possible self-dealing)
    if (this.areNamesSimilar(exporterName, buyerName)) {
      score += 15;
    }

    return score;
  }

  private getNameRiskScore(name: string): number {
    const normalizedName = name.toLowerCase();
    let riskScore = 0;

    // Check against fraud indicators
    for (const indicator of this.FRAUD_INDICATORS) {
      if (normalizedName.includes(indicator)) {
        riskScore += 20;
      }
    }

    // Check against high-risk entity patterns
    for (const pattern of this.HIGH_RISK_ENTITIES) {
      if (normalizedName.includes(pattern)) {
        riskScore += 15;
      }
    }

    // Check for generic/suspicious name patterns
    if (this.isGenericName(normalizedName)) {
      riskScore += 10;
    }

    return Math.min(riskScore, 40);
  }

  private analyzeTransactionPattern(request: FraudCheckRequest): number {
    let score = 0;
    const amount = parseFloat(request.amount);

    // Unusual round numbers (potential money laundering)
    if (this.isUnusuallyRoundNumber(amount)) {
      score += 10;
    }

    // Amount vs commodity mismatch
    if (this.isAmountCommodityMismatch(amount, request.commodity)) {
      score += 15;
    }

    return score;
  }

  private analyzeGeographicRisk(supplierCountry: string, buyerCountry: string): number {
    let score = 0;

    // High-risk country combinations
    const riskyCombinations = [
      ['afghanistan', 'pakistan'], ['colombia', 'venezuela'], ['mexico', 'guatemala'],
      ['myanmar', 'china'], ['somalia', 'kenya'], ['syria', 'lebanon']
    ];

    const supplier = supplierCountry.toLowerCase();
    const buyer = buyerCountry.toLowerCase();

    for (const [country1, country2] of riskyCombinations) {
      if ((supplier.includes(country1) && buyer.includes(country2)) ||
          (supplier.includes(country2) && buyer.includes(country1))) {
        score += 20;
        break;
      }
    }

    return score;
  }

  private identifyRiskFactors(request: FraudCheckRequest): string[] {
    const factors: string[] = [];
    const amount = parseFloat(request.amount);

    // Amount-based risk factors
    if (amount > 10000000) { // > $100M
      factors.push('Extremely large transaction amount');
    } else if (amount > 1000000) { // > $10M
      factors.push('Large transaction requiring enhanced oversight');
    }

    if (this.isUnusuallyRoundNumber(amount)) {
      factors.push('Suspiciously round transaction amount');
    }

    // Entity risk factors
    if (this.hasHighRiskKeywords(request.exporterName)) {
      factors.push('Exporter name contains high-risk keywords');
    }

    if (this.hasHighRiskKeywords(request.buyerName)) {
      factors.push('Buyer name contains high-risk keywords');
    }

    // Commodity risk factors
    if (this.isSuspiciousCommodity(request.commodity)) {
      factors.push('High-risk or prohibited commodity');
    }

    return factors;
  }

  private analyzeAmountPatterns(amount: number): { score: number; indicators: string[] } {
    const indicators: string[] = [];
    let score = 0;

    // Structuring detection (amounts just under reporting thresholds)
    if (amount >= 9500 && amount < 10000) {
      score += 25;
      indicators.push('Amount appears structured to avoid $10K reporting threshold');
    }

    if (amount >= 49500 && amount < 50000) {
      score += 20;
      indicators.push('Amount appears structured to avoid $50K reporting threshold');
    }

    // Unusual precision for large amounts
    if (amount > 100000 && amount % 1 !== 0) {
      score += 10;
      indicators.push('Unusual precision for large transaction amount');
    }

    // Multiple of suspicious amounts
    const suspiciousMultiples = [7777, 8888, 9999, 11111];
    for (const multiple of suspiciousMultiples) {
      if (amount % multiple === 0 && amount > multiple) {
        score += 15;
        indicators.push(`Amount is suspicious multiple of ${multiple}`);
      }
    }

    return { score, indicators };
  }

  private analyzeEntityRisk(exporterName: string, buyerName: string): { score: number; indicators: string[] } {
    const indicators: string[] = [];
    let score = 0;

    // Check for shell company indicators
    if (this.appearsToBeShellCompany(exporterName)) {
      score += 30;
      indicators.push('Exporter appears to be a shell company');
    }

    if (this.appearsToBeShellCompany(buyerName)) {
      score += 30;
      indicators.push('Buyer appears to be a shell company');
    }

    // Check for name manipulation attempts
    if (this.hasNameManipulation(exporterName) || this.hasNameManipulation(buyerName)) {
      score += 20;
      indicators.push('Potential name manipulation detected');
    }

    return { score, indicators };
  }

  private analyzeCommodityRisk(commodity: string): { score: number; indicators: string[] } {
    const indicators: string[] = [];
    let score = 0;

    if (this.isSuspiciousCommodity(commodity)) {
      score += 40;
      indicators.push(`High-risk commodity: ${commodity}`);
    }

    // Check for vague commodity descriptions
    if (this.isVagueCommodityDescription(commodity)) {
      score += 15;
      indicators.push('Vague or non-specific commodity description');
    }

    return { score, indicators };
  }

  // Helper methods
  private areNamesSimilar(name1: string, name2: string): boolean {
    const normalized1 = name1.toLowerCase().replace(/[^\w]/g, '');
    const normalized2 = name2.toLowerCase().replace(/[^\w]/g, '');
    
    // Check for substring matches
    return normalized1.includes(normalized2) || normalized2.includes(normalized1) ||
           this.calculateSimilarity(normalized1, normalized2) > 0.7;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + indicator
        );
      }
    }

    return matrix[str2.length][str1.length];
  }

  private isGenericName(name: string): boolean {
    const genericPatterns = ['company', 'corp', 'ltd', 'llc', 'inc', 'trading', 'international', 'global', 'worldwide'];
    const words = name.split(' ');
    return words.length <= 3 && genericPatterns.some(pattern => name.includes(pattern));
  }

  private isUnusuallyRoundNumber(amount: number): boolean {
    // Check for perfect multiples of large round numbers
    const roundChecks = [1000000, 500000, 100000, 50000];
    return roundChecks.some(check => amount % check === 0 && amount >= check);
  }

  private isAmountCommodityMismatch(amount: number, commodity: string): boolean {
    // Simple heuristics for amount/commodity mismatches
    const lowValueCommodities = ['textiles', 'clothing', 'food products', 'paper'];
    const highValueCommodities = ['electronics', 'machinery', 'precious metals', 'pharmaceuticals'];
    
    const isLowValue = lowValueCommodities.some(c => commodity.toLowerCase().includes(c));
    const isHighValue = highValueCommodities.some(c => commodity.toLowerCase().includes(c));
    
    return (isLowValue && amount > 1000000) || (isHighValue && amount < 10000);
  }

  private hasHighRiskKeywords(name: string): boolean {
    return this.FRAUD_INDICATORS.some(keyword => name.toLowerCase().includes(keyword));
  }

  private isSuspiciousCommodity(commodity: string): boolean {
    return this.SUSPICIOUS_COMMODITIES.some(sus => commodity.toLowerCase().includes(sus));
  }

  private appearsToBeShellCompany(name: string): boolean {
    const shellIndicators = ['holdings', 'ventures', 'capital', 'investments', 'fund', 'group'];
    const genericWords = ['international', 'global', 'worldwide', 'universal'];
    
    const normalizedName = name.toLowerCase();
    const hasShellIndicator = shellIndicators.some(indicator => normalizedName.includes(indicator));
    const hasGenericWord = genericWords.some(word => normalizedName.includes(word));
    
    return hasShellIndicator && hasGenericWord;
  }

  private hasNameManipulation(name: string): boolean {
    // Check for common manipulation techniques
    const manipulationPatterns = [
      /(.)\1{3,}/, // Repeated characters (aaaa)
      /[0-9]{4,}/, // Long number sequences
      /[^a-zA-Z0-9\s&\-\.]{2,}/, // Multiple special characters
    ];
    
    return manipulationPatterns.some(pattern => pattern.test(name));
  }

  private isVagueCommodityDescription(commodity: string): boolean {
    const vaguePhrases = ['general goods', 'various items', 'mixed products', 'assorted', 'miscellaneous'];
    return vaguePhrases.some(phrase => commodity.toLowerCase().includes(phrase)) || commodity.length < 5;
  }

  private categorizeRiskFactors(indicators: string[]): string[] {
    const categories = new Set<string>();
    
    indicators.forEach(indicator => {
      if (indicator.includes('amount') || indicator.includes('transaction')) {
        categories.add('Transaction Risk');
      } else if (indicator.includes('entity') || indicator.includes('name') || indicator.includes('company')) {
        categories.add('Entity Risk');
      } else if (indicator.includes('commodity') || indicator.includes('product')) {
        categories.add('Commodity Risk');
      } else if (indicator.includes('country') || indicator.includes('geographic')) {
        categories.add('Geographic Risk');
      } else {
        categories.add('General Risk');
      }
    });
    
    return Array.from(categories);
  }
}