// src/types.ts - Complete YieldX Protocol Types
import { LucideIcon } from 'lucide-react';

// ===== NAVIGATION & UI TYPES =====
export type TabId = 'home' | 'dashboard' | 'invest' | 'submit' | 'nft-marketplace' | 'committee';

// ===== LEGACY INVOICE TYPES (for backwards compatibility) =====
export interface Invoice {
  id: number;
  commodity: string;
  amount: number;
  exporter: string;
  country: string;
  status: 'Pending' | 'Verified' | 'Funding' | 'Active' | 'Paid';
  apr: number;
  funded: number;
  daysLeft: number;
  tokenId?: number;
  createdAt?: number;
  riskScore?: number;
  icon?: LucideIcon;
}

// ===== MARKET & BLOCKCHAIN TYPES =====
export interface MarketData {
  ethPrice: number;
  usdcPrice: number;
  timestamp: number;
  marketRisk: number;
}

export interface VaultInfo {
  targetAmount: bigint;
  currentAmount: bigint;
  finalAPR: bigint;
  active: boolean;
}

export interface InvestmentCalculation {
  principal: number;
  expectedYield: number;
  totalReturn: number;
  apr: number;
}

export interface SubmitInvoiceForm {
  commodity: string;
  amount: string;
  exporterName: string;
  buyerName: string;
  destination: string;
  description: string;
  originCountry: string;
}

export interface ContractAddresses {
  MOCK_USDC: `0x${string}`;
  INVOICE_NFT: `0x${string}`;
  PROTOCOL: `0x${string}`;
}

export interface ChainlinkFeeds {
  ETH_USD: `0x${string}`;
  USDC_USD: `0x${string}`;
}

export interface TransactionResult {
  hash: string;
  success: boolean;
  error?: string;
  invoiceId?: string;
  responseLength?: number;
  requestId?: string;
}

export interface ProtocolStats {
  totalVolume: number;
  totalInvoices: number;
  averageAPR: number;
  activeInvestors: number;
}

// ===== NFT INVOICE TYPES =====
export enum NFTInvoiceStatus {
  PENDING = 0,
  VERIFIED = 1,
  FUNDED = 2,
  PAID = 3
}

export interface NFTInvoiceData {
  tokenId: number;
  owner: string;
  commodity: string;
  amount: bigint;
  exporterName: string;
  buyerName: string;
  destination: string;
  dueDate: number;
  status: NFTInvoiceStatus;
  createdAt: number;
  riskScore: number;
  finalAPR: number;
  documentHash: string;
  chainlinkVerified: boolean;
  committeeApproved: boolean;
  fundingProgress: number; // Percentage funded (0-100)
  investorCount: number;
  totalYieldPaid: bigint;
}

export interface NFTVaultInfo {
  tokenId: number;
  targetAmount: bigint;
  currentAmount: bigint;
  finalAPR: number;
  active: boolean;
  investors: string[];
  investmentHistory: NFTInvestment[];
}

export interface NFTInvestment {
  investor: string;
  amount: bigint;
  timestamp: number;
  txHash: string;
}

export interface NFTStats {
  totalNFTs: number;
  ownedCount: number;
  verifiedCount: number;
  fundedCount: number;
  totalValue: number;
  averageAPR: number;
}

// ===== INVESTMENT COMMITTEE TYPES =====
export enum ProposalStatus {
  PENDING_DOCUMENTS = 0,
  CHAINLINK_VERIFICATION = 1,
  COMMITTEE_REVIEW = 2,
  APPROVED = 3,
  REJECTED = 4,
  LIVE_INVESTMENT = 5
}

export enum VoteType {
  PENDING = 0,
  APPROVE = 1,
  REJECT = 2,
  ABSTAIN = 3
}

export interface DocumentHash {
  filename: string;
  hash: string;
  timestamp: number;
  verified: boolean;
  fileSize?: number;
  mimeType?: string;
}

export interface ChainlinkVerification {
  ethPrice: number;
  usdcPrice: number;
  marketRisk: number;
  timestamp: number;
  oracleSignature: string;
  vrfRequestId?: string;
  automationUpkeepId?: string;
}

export interface CommitteeVote {
  member: string;
  role: string;
  vote: VoteType;
  reasoning: string;
  timestamp: number;
  txHash: string;
  blockNumber?: number;
}

export interface InvestmentProposal {
  id: number;
  submitter: string;
  commodity: string;
  amount: bigint;
  exporterName: string;
  buyerName?: string;
  destination?: string;
  status: ProposalStatus;
  documents: DocumentHash[];
  chainlinkVerification?: ChainlinkVerification;
  committeeVotes: CommitteeVote[];
  approvalTimestamp?: number;
  targetFunding: bigint;
  currentFunding: bigint;
  proposedAPR: number;
  finalAPR: number;
  riskScore: number;
  createdAt: number;
  dueDate?: number;
  // NFT Integration
  nftTokenId?: number;
  nftMinted?: boolean;
}

export interface CommitteeStats {
  totalProposals: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  liveInvestments: number;
  totalFunding: number;
  averageProcessingTime: number; // in hours
}

export interface CommitteeMember {
  address: string;
  role: string;
  joinedAt: number;
  totalVotes: number;
  approvalRate: number; // percentage
  isActive: boolean;
}

// ===== VERIFICATION SYSTEM TYPES =====
export interface VerificationStep {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  timestamp?: number;
  result?: any;
  txHash?: string;
}

export interface TamperProofRecord {
  documentHash: string;
  chainlinkSignature: string;
  committeeSignatures: string[];
  blockNumber: number;
  timestamp: number;
  ipfsHash?: string;
}

export interface InvestmentTracking {
  proposalId: number;
  nftTokenId: number;
  investments: {
    investor: string;
    amount: bigint;
    timestamp: number;
    expectedYield: bigint;
    actualYield?: bigint;
    status: 'active' | 'paid' | 'defaulted';
  }[];
  totalInvested: bigint;
  totalYieldPaid: bigint;
  roi: number; // Return on investment percentage
}

// ===== CHAINLINK INTEGRATION TYPES =====
export interface ChainlinkPriceFeed {
  address: string;
  decimals: number;
  description: string;
  latestPrice: bigint;
  lastUpdated: number;
  roundId: bigint;
}

export interface ChainlinkVRFRequest {
  requestId: string;
  proposalId: number;
  randomWords?: bigint[];
  fulfilled: boolean;
  timestamp: number;
}

export interface ChainlinkAutomation {
  upkeepId: string;
  target: string;
  checkData: string;
  lastPerformed: number;
  balance: bigint;
  isActive: boolean;
}

// ===== ERROR HANDLING TYPES =====
export interface ErrorState {
  hasError: boolean;
  message: string;
  code?: string;
  timestamp: number;
}

export interface LoadingState {
  isLoading: boolean;
  operation?: string;
  progress?: number; // 0-100
}

// ===== API RESPONSE TYPES =====
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ===== UTILITY TYPES =====
export interface FilterOptions {
  status?: ProposalStatus | NFTInvoiceStatus;
  commodity?: string;
  minAmount?: number;
  maxAmount?: number;
  minAPR?: number;
  maxAPR?: number;
  dateRange?: {
    start: number;
    end: number;
  };
}

export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// ===== CONSTANTS =====
export const COMMITTEE_ROLES = {
  LEAD_ANALYST: 'Lead Analyst',
  RISK_MANAGER: 'Risk Manager',
  COMPLIANCE_OFFICER: 'Compliance Officer',
  PORTFOLIO_MANAGER: 'Portfolio Manager'
} as const;

export const NFT_STATUS_LABELS = {
  [NFTInvoiceStatus.PENDING]: 'Pending Verification',
  [NFTInvoiceStatus.VERIFIED]: 'Verified & Open',
  [NFTInvoiceStatus.FUNDED]: 'Fully Funded',
  [NFTInvoiceStatus.PAID]: 'Completed'
} as const;

export const PROPOSAL_STATUS_LABELS = {
  [ProposalStatus.PENDING_DOCUMENTS]: 'Documents Pending',
  [ProposalStatus.CHAINLINK_VERIFICATION]: 'Chainlink Verification',
  [ProposalStatus.COMMITTEE_REVIEW]: 'Committee Review',
  [ProposalStatus.APPROVED]: 'Approved',
  [ProposalStatus.REJECTED]: 'Rejected',
  [ProposalStatus.LIVE_INVESTMENT]: 'Live Investment'
} as const;

// ===== TYPE GUARDS =====
export function isNFTInvoiceData(obj: any): obj is NFTInvoiceData {
  return obj && typeof obj.tokenId === 'number' && typeof obj.owner === 'string';
}

export function isInvestmentProposal(obj: any): obj is InvestmentProposal {
  return obj && typeof obj.id === 'number' && typeof obj.submitter === 'string';
}

export function isCommitteeVote(obj: any): obj is CommitteeVote {
  return obj && typeof obj.member === 'string' && typeof obj.vote === 'number';
}

// ===== LEGACY COMPATIBILITY =====
// Map legacy Invoice type to new NFTInvoiceData
export function invoiceToNFTData(invoice: Invoice): Partial<NFTInvoiceData> {
  return {
    tokenId: invoice.tokenId || invoice.id,
    commodity: invoice.commodity,
    amount: BigInt(invoice.amount * 1000000), // Convert to 6 decimal USDC
    exporterName: invoice.exporter,
    finalAPR: invoice.apr * 100, // Convert to basis points
    fundingProgress: invoice.funded,
    riskScore: invoice.riskScore || 0,
    createdAt: invoice.createdAt || Date.now()
  };
}