// src/utils/nftImageGenerator.ts - Generate Cool NFT Images
import { NFTInvoiceData, NFTInvoiceStatus } from '../types';

// NFT Image Configuration
interface NFTImageConfig {
  width: number;
  height: number;
  backgroundColor: string;
  gradientColors: string[];
  borderColor: string;
  textColor: string;
  accentColor: string;
}

// Commodity-specific themes
const COMMODITY_THEMES: Record<string, NFTImageConfig> = {
  'Coffee': {
    width: 512,
    height: 512,
    backgroundColor: '#8B4513',
    gradientColors: ['#D2691E', '#8B4513', '#654321'],
    borderColor: '#F4A460',
    textColor: '#FFFFFF',
    accentColor: '#FFD700'
  },
  'Cocoa': {
    width: 512,
    height: 512,
    backgroundColor: '#7B3F00',
    gradientColors: ['#D2691E', '#7B3F00', '#4A2C00'],
    borderColor: '#CD853F',
    textColor: '#FFFFFF',
    accentColor: '#FF6347'
  },
  'Gold': {
    width: 512,
    height: 512,
    backgroundColor: '#FFD700',
    gradientColors: ['#FFD700', '#FFA500', '#FF8C00'],
    borderColor: '#FFFF00',
    textColor: '#000000',
    accentColor: '#DAA520'
  },
  'Oil': {
    width: 512,
    height: 512,
    backgroundColor: '#2F4F4F',
    gradientColors: ['#2F4F4F', '#1C1C1C', '#000000'],
    borderColor: '#708090',
    textColor: '#FFFFFF',
    accentColor: '#32CD32'
  },
  'Cotton': {
    width: 512,
    height: 512,
    backgroundColor: '#F5F5DC',
    gradientColors: ['#FFFFFF', '#F5F5DC', '#E6E6FA'],
    borderColor: '#DDA0DD',
    textColor: '#4B0082',
    accentColor: '#9370DB'
  },
  'Default': {
    width: 512,
    height: 512,
    backgroundColor: '#4169E1',
    gradientColors: ['#4169E1', '#6A5ACD', '#483D8B'],
    borderColor: '#9370DB',
    textColor: '#FFFFFF',
    accentColor: '#00FFFF'
  }
};

// Status colors and badges
const STATUS_STYLES = {
  [NFTInvoiceStatus.PENDING]: {
    color: '#FF8C00',
    text: 'PENDING',
    emoji: '⏳'
  },
  [NFTInvoiceStatus.VERIFIED]: {
    color: '#32CD32',
    text: 'VERIFIED',
    emoji: '✅'
  },
  [NFTInvoiceStatus.FUNDED]: {
    color: '#00CED1',
    text: 'FUNDED',
    emoji: '💰'
  },
  [NFTInvoiceStatus.PAID]: {
    color: '#9370DB',
    text: 'COMPLETED',
    emoji: '🏆'
  }
};

export class NFTImageGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  // Generate SVG-based NFT image (for better scalability)
  generateSVGImage(nft: NFTInvoiceData): string {
    const commodityKey = Object.keys(COMMODITY_THEMES).find(key => 
      nft.commodity.toLowerCase().includes(key.toLowerCase())
    ) || 'Default';
    
    const theme = COMMODITY_THEMES[commodityKey];
    const status = STATUS_STYLES[nft.status];
    const amount = Number(nft.amount) / 1000000; // Convert from wei to USDC

    const svg = `
      <svg width="${theme.width}" height="${theme.height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- Background Gradient -->
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:${theme.gradientColors[0]};stop-opacity:1" />
            <stop offset="50%" style="stop-color:${theme.gradientColors[1]};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${theme.gradientColors[2]};stop-opacity:1" />
          </linearGradient>
          
          <!-- Border Glow -->
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <!-- Text Shadow -->
          <filter id="textShadow">
            <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)"/>
          </filter>
        </defs>
        
        <!-- Background -->
        <rect width="100%" height="100%" fill="url(#bgGradient)"/>
        
        <!-- Border Frame -->
        <rect x="20" y="20" width="472" height="472" 
              fill="none" 
              stroke="${theme.borderColor}" 
              stroke-width="4" 
              filter="url(#glow)"/>
        
        <!-- Header Section -->
        <rect x="40" y="40" width="432" height="80" 
              fill="rgba(255,255,255,0.1)" 
              stroke="${theme.accentColor}" 
              stroke-width="2" 
              rx="10"/>
        
        <!-- YieldX Logo -->
        <text x="60" y="70" 
              font-family="Arial, sans-serif" 
              font-size="24" 
              font-weight="bold" 
              fill="${theme.accentColor}">YIELDX</text>
        
        <!-- Token ID -->
        <text x="60" y="95" 
              font-family="Arial, sans-serif" 
              font-size="14" 
              fill="${theme.textColor}" 
              opacity="0.8">TOKEN #${nft.tokenId}</text>
        
        <!-- Status Badge -->
        <rect x="350" y="50" width="110" height="30" 
              fill="${status.color}" 
              rx="15"/>
        <text x="405" y="70" 
              font-family="Arial, sans-serif" 
              font-size="12" 
              font-weight="bold" 
              fill="white" 
              text-anchor="middle">${status.emoji} ${status.text}</text>
        
        <!-- Commodity Icon/Symbol -->
        <circle cx="256" cy="200" r="60" 
                fill="rgba(255,255,255,0.2)" 
                stroke="${theme.accentColor}" 
                stroke-width="3"/>
        <text x="256" y="210" 
              font-family="Arial, sans-serif" 
              font-size="36" 
              font-weight="bold" 
              fill="${theme.textColor}" 
              text-anchor="middle" 
              filter="url(#textShadow)">${this.getCommodityEmoji(nft.commodity)}</text>
        
        <!-- Commodity Name -->
        <text x="256" y="290" 
              font-family="Arial, sans-serif" 
              font-size="28" 
              font-weight="bold" 
              fill="${theme.textColor}" 
              text-anchor="middle" 
              filter="url(#textShadow)">${nft.commodity.toUpperCase()}</text>
        
        <!-- Amount Section -->
        <rect x="60" y="320" width="392" height="60" 
              fill="rgba(0,0,0,0.3)" 
              stroke="${theme.accentColor}" 
              stroke-width="2" 
              rx="10"/>
        <text x="256" y="345" 
              font-family="Arial, sans-serif" 
              font-size="16" 
              fill="${theme.textColor}" 
              text-anchor="middle" 
              opacity="0.9">INVOICE AMOUNT</text>
        <text x="256" y="370" 
              font-family="Arial, sans-serif" 
              font-size="24" 
              font-weight="bold" 
              fill="${theme.accentColor}" 
              text-anchor="middle">$${amount.toLocaleString()}</text>
        
        <!-- Exporter Info -->
        <text x="60" y="410" 
              font-family="Arial, sans-serif" 
              font-size="14" 
              fill="${theme.textColor}" 
              opacity="0.8">EXPORTER:</text>
        <text x="60" y="430" 
              font-family="Arial, sans-serif" 
              font-size="16" 
              font-weight="bold" 
              fill="${theme.textColor}">${nft.exporterName}</text>
        
        <!-- APR Display (if available) -->
        ${nft.finalAPR > 0 ? `
        <rect x="300" y="395" width="152" height="40" 
              fill="${theme.accentColor}" 
              rx="5"/>
        <text x="376" y="415" 
              font-family="Arial, sans-serif" 
              font-size="18" 
              font-weight="bold" 
              fill="black" 
              text-anchor="middle">${(nft.finalAPR / 100).toFixed(1)}% APR</text>
        ` : ''}
        
        <!-- Blockchain Badges -->
        <g transform="translate(60, 450)">
          ${nft.chainlinkVerified ? `
          <rect x="0" y="0" width="80" height="25" fill="#FF6B35" rx="12"/>
          <text x="40" y="17" font-family="Arial, sans-serif" font-size="10" fill="white" text-anchor="middle">⚡ CHAINLINK</text>
          ` : ''}
          
          ${nft.committeeApproved ? `
          <rect x="90" y="0" width="80" height="25" fill="#8A2BE2" rx="12"/>
          <text x="130" y="17" font-family="Arial, sans-serif" font-size="10" fill="white" text-anchor="middle">🛡️ APPROVED</text>
          ` : ''}
          
          <rect x="180" y="0" width="60" height="25" fill="#1E90FF" rx="12"/>
          <text x="210" y="17" font-family="Arial, sans-serif" font-size="10" fill="white" text-anchor="middle">📄 NFT</text>
        </g>
        
        <!-- Bottom watermark -->
        <text x="256" y="495" 
              font-family="Arial, sans-serif" 
              font-size="10" 
              fill="${theme.textColor}" 
              text-anchor="middle" 
              opacity="0.6">AFRICAN TRADE FINANCE • BASE SEPOLIA</text>
      </svg>
    `;

    return svg;
  }

  // Convert SVG to data URL
  svgToDataURL(svg: string): string {
    const encoded = encodeURIComponent(svg);
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  }

  // Generate metadata for OpenSea
  generateOpenSeaMetadata(nft: NFTInvoiceData): any {
    const commodityKey = Object.keys(COMMODITY_THEMES).find(key => 
      nft.commodity.toLowerCase().includes(key.toLowerCase())
    ) || 'Default';
    
    const svg = this.generateSVGImage(nft);
    const imageURL = this.svgToDataURL(svg);
    const amount = Number(nft.amount) / 1000000;

    return {
      name: `YieldX Invoice #${nft.tokenId} - ${nft.commodity}`,
      description: `Tokenized trade finance invoice from ${nft.exporterName}. This NFT represents a real-world African export invoice worth $${amount.toLocaleString()} USDC, verified by Chainlink oracles and approved by our investment committee. Holders have proportional rights to trade finance returns.`,
      image: imageURL,
      external_url: `https://yieldx.finance/nft/${nft.tokenId}`,
      attributes: [
        {
          trait_type: "Commodity",
          value: nft.commodity
        },
        {
          trait_type: "Exporter",
          value: nft.exporterName
        },
        {
          trait_type: "Status",
          value: this.getStatusText(nft.status)
        },
        {
          trait_type: "Invoice Amount",
          value: amount,
          display_type: "number"
        },
        {
          trait_type: "APR",
          value: nft.finalAPR / 100,
          display_type: "number"
        },
        {
          trait_type: "Risk Score",
          value: nft.riskScore,
          display_type: "number",
          max_value: 100
        },
        {
          trait_type: "Funding Progress",
          value: nft.fundingProgress,
          display_type: "boost_percentage"
        },
        {
          trait_type: "Investor Count",
          value: nft.investorCount,
          display_type: "number"
        },
        {
          trait_type: "Chainlink Verified",
          value: nft.chainlinkVerified ? "Yes" : "No"
        },
        {
          trait_type: "Committee Approved",
          value: nft.committeeApproved ? "Yes" : "No"
        },
        {
          trait_type: "Destination",
          value: nft.destination
        },
        {
          trait_type: "Theme",
          value: commodityKey
        },
        {
          trait_type: "Created",
          value: new Date(nft.createdAt).getFullYear(),
          display_type: "date"
        }
      ],
      background_color: COMMODITY_THEMES[commodityKey].backgroundColor.replace('#', ''),
      animation_url: null, // Could add animated version later
      youtube_url: null,
      properties: {
        category: "Trade Finance",
        subcategory: "African Exports",
        blockchain: "Base Sepolia",
        protocol: "YieldX",
        verified: nft.chainlinkVerified && nft.committeeApproved
      }
    };
  }

  // Get commodity emoji
  private getCommodityEmoji(commodity: string): string {
    const lower = commodity.toLowerCase();
    if (lower.includes('coffee')) return '☕';
    if (lower.includes('cocoa') || lower.includes('chocolate')) return '🍫';
    if (lower.includes('gold')) return '🏆';
    if (lower.includes('oil')) return '🛢️';
    if (lower.includes('cotton')) return '🌾';
    if (lower.includes('tea')) return '🫖';
    if (lower.includes('sugar')) return '🍯';
    if (lower.includes('rubber')) return '⚫';
    if (lower.includes('timber') || lower.includes('wood')) return '🌳';
    if (lower.includes('diamond')) return '💎';
    return '📦'; // Default package icon
  }

  // Get status text
  private getStatusText(status: NFTInvoiceStatus): string {
    switch (status) {
      case NFTInvoiceStatus.PENDING: return 'Pending';
      case NFTInvoiceStatus.VERIFIED: return 'Verified';
      case NFTInvoiceStatus.FUNDED: return 'Funded';
      case NFTInvoiceStatus.PAID: return 'Completed';
      default: return 'Unknown';
    }
  }

  // Generate and download NFT image
  downloadNFTImage(nft: NFTInvoiceData, format: 'svg' | 'png' = 'svg') {
    if (format === 'svg') {
      const svg = this.generateSVGImage(nft);
      const blob = new Blob([svg], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `yieldx-nft-${nft.tokenId}-${nft.commodity.replace(/\s+/g, '-').toLowerCase()}.svg`;
      a.click();
      
      URL.revokeObjectURL(url);
    } else if (format === 'png') {
      // Convert SVG to PNG using canvas
      const svg = this.generateSVGImage(nft);
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      
      canvas.width = 512;
      canvas.height = 512;
      
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `yieldx-nft-${nft.tokenId}-${nft.commodity.replace(/\s+/g, '-').toLowerCase()}.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png');
      };
      
      img.src = this.svgToDataURL(svg);
    }
  }
}

// Export singleton instance
export const nftImageGenerator = new NFTImageGenerator();