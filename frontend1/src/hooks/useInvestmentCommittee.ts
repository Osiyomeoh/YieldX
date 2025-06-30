// src/hooks/useInvestmentCommittee.ts - Multi-Stage Verification & Approval System
import { useState, useEffect, useCallback } from 'react';
// @ts-ignore
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits, getAddress, keccak256, toBytes } from 'viem';

// Investment Committee Members
const COMMITTEE_MEMBERS = {
  LEAD_ANALYST: getAddress("0x742d35Cc6634C0532925a3b8D6Dc24B3aa231a99"),
  RISK_MANAGER: getAddress("0x2546BcD3c84621e976D8185a91A922aE77ECEc30"),
  COMPLIANCE_OFFICER: getAddress("0xbDA5747bFD65F08deb54cb465eB87D40e51B197E"),
  PORTFOLIO_MANAGER: getAddress("0xdD2FD4581271e230360230F9337D5c0430Bf44C0")
} as const;

// Investment Proposal Status
enum ProposalStatus {
  PENDING_DOCUMENTS = 0,
  CHAINLINK_VERIFICATION = 1,
  COMMITTEE_REVIEW = 2,
  APPROVED = 3,
  REJECTED = 4,
  LIVE_INVESTMENT = 5
}

// Committee Vote Types
enum VoteType {
  PENDING = 0,
  APPROVE = 1,
  REJECT = 2,
  ABSTAIN = 3
}

interface DocumentHash {
  filename: string;
  hash: string;
  timestamp: number;
  verified: boolean;
}

interface ChainlinkVerification {
  ethPrice: number;
  usdcPrice: number;
  marketRisk: number;
  timestamp: number;
  oracleSignature: string;
}

interface CommitteeVote {
  member: string;
  role: string;
  vote: VoteType;
  reasoning: string;
  timestamp: number;
  txHash: string;
}

interface InvestmentProposal {
  id: number;
  submitter: string;
  commodity: string;
  amount: bigint;
  exporterName: string;
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
}

export function useInvestmentCommittee() {
  const { address, isConnected } = useAccount();
  const { writeContractAsync, isPending } = useWriteContract();
  const [proposals, setProposals] = useState<InvestmentProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>();

  // Check if current user is a committee member
  const isCommitteeMember = useCallback(() => {
    if (!address) return false;
    return Object.values(COMMITTEE_MEMBERS).includes(address);
  }, [address]);

  // Get committee member role
  const getCommitteeRole = useCallback(() => {
    if (!address) return null;
    for (const [role, memberAddress] of Object.entries(COMMITTEE_MEMBERS)) {
      if (memberAddress === address) {
        return role.replace('_', ' ');
      }
    }
    return null;
  }, [address]);

  // STEP 1: Submit Investment Proposal with Document Upload
  const submitProposal = useCallback(async (
    commodity: string,
    amount: string,
    exporterName: string,
    documents: File[]
  ) => {
    setLoading(true);
    try {
      // Hash all documents for tamper-proof verification
      const documentHashes: DocumentHash[] = [];
      
      for (const file of documents) {
        const arrayBuffer = await file.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);
        const hash = keccak256(bytes);
        
        documentHashes.push({
          filename: file.name,
          hash,
          timestamp: Date.now(),
          verified: false
        });
      }

      // Create proposal
      const proposal: InvestmentProposal = {
        id: Date.now(),
        submitter: address!,
        commodity,
        amount: parseUnits(amount, 6),
        exporterName,
        status: ProposalStatus.PENDING_DOCUMENTS,
        documents: documentHashes,
        committeeVotes: [],
        targetFunding: parseUnits((parseFloat(amount) * 0.85).toString(), 6), // 85% funding ratio
        currentFunding: BigInt(0),
        proposedAPR: 1200, // 12% base APR
        finalAPR: 0,
        riskScore: 0,
        createdAt: Date.now()
      };

      setProposals(prev => [...prev, proposal]);
      
      console.log('📄 Investment Proposal Submitted:', {
        id: proposal.id,
        commodity,
        amount,
        documents: documentHashes.length
      });

      return { success: true, proposalId: proposal.id };
    } catch (error: any) {
      console.error('❌ Proposal submission failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [address]);

  // STEP 2: Trigger Chainlink Verification
  const triggerChainlinkVerification = useCallback(async (proposalId: number) => {
    setLoading(true);
    try {
      // Simulate Chainlink price feed calls
      const ethPrice = 2400 + (Math.random() - 0.5) * 200; // ETH price simulation
      const usdcPrice = 1.0 + (Math.random() - 0.5) * 0.02; // USDC price simulation
      const marketRisk = Math.random() * 0.1; // 0-10% market risk

      const chainlinkVerification: ChainlinkVerification = {
        ethPrice,
        usdcPrice,
        marketRisk,
        timestamp: Date.now(),
        oracleSignature: keccak256(toBytes(`${ethPrice}${usdcPrice}${Date.now()}`))
      };

      setProposals(prev => 
        prev.map(p => 
          p.id === proposalId 
            ? { 
                ...p, 
                status: ProposalStatus.COMMITTEE_REVIEW,
                chainlinkVerification,
                documents: p.documents.map(d => ({ ...d, verified: true }))
              }
            : p
        )
      );

      console.log('🔗 Chainlink Verification Complete:', chainlinkVerification);
      return { success: true, verification: chainlinkVerification };
    } catch (error: any) {
      console.error('❌ Chainlink verification failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // STEP 3: Committee Member Vote
  const submitCommitteeVote = useCallback(async (
    proposalId: number,
    vote: VoteType,
    reasoning: string
  ) => {
    if (!isCommitteeMember()) {
      return { success: false, error: 'Not a committee member' };
    }

    setLoading(true);
    try {
      const role = getCommitteeRole()!;
      const newVote: CommitteeVote = {
        member: address!,
        role,
        vote,
        reasoning,
        timestamp: Date.now(),
        txHash: `0x${Math.random().toString(16).substr(2, 40)}` // Simulated tx hash
      };

      setProposals(prev => 
        prev.map(p => {
          if (p.id === proposalId) {
            const updatedVotes = [...p.committeeVotes.filter(v => v.member !== address), newVote];
            
            // Check if all 4 members have voted and all approved
            const allVoted = updatedVotes.length === 4;
            const allApproved = updatedVotes.every(v => v.vote === VoteType.APPROVE);
            const hasRejection = updatedVotes.some(v => v.vote === VoteType.REJECT);

            let newStatus = p.status;
            let approvalTimestamp = p.approvalTimestamp;
            let finalAPR = p.finalAPR;

            if (allVoted) {
              if (allApproved) {
                newStatus = ProposalStatus.APPROVED;
                approvalTimestamp = Date.now();
                // Calculate final APR with Chainlink data
                const baseAPR = p.proposedAPR;
                const riskPremium = p.chainlinkVerification ? p.chainlinkVerification.marketRisk * 100 : 0;
                finalAPR = baseAPR + riskPremium;
              } else if (hasRejection) {
                newStatus = ProposalStatus.REJECTED;
              }
            }

            return {
              ...p,
              committeeVotes: updatedVotes,
              status: newStatus,
              approvalTimestamp,
              finalAPR
            };
          }
          return p;
        })
      );

      console.log('🗳️ Committee Vote Submitted:', { role, vote, reasoning });
      return { success: true, vote: newVote };
    } catch (error: any) {
      console.error('❌ Vote submission failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, [address, isCommitteeMember, getCommitteeRole]);

  // STEP 4: Open Investment to Public (Only after unanimous approval)
  const openPublicInvestment = useCallback(async (proposalId: number) => {
    setLoading(true);
    try {
      setProposals(prev => 
        prev.map(p => 
          p.id === proposalId && p.status === ProposalStatus.APPROVED
            ? { ...p, status: ProposalStatus.LIVE_INVESTMENT }
            : p
        )
      );

      console.log('🎯 Investment Opened to Public:', proposalId);
      return { success: true };
    } catch (error: any) {
      console.error('❌ Failed to open investment:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // STEP 5: Make Investment (Only for approved proposals)
  const makeInvestment = useCallback(async (proposalId: number, amount: string) => {
    setLoading(true);
    try {
      const investmentAmount = parseUnits(amount, 6);
      
      setProposals(prev => 
        prev.map(p => 
          p.id === proposalId
            ? { ...p, currentFunding: p.currentFunding + investmentAmount }
            : p
        )
      );

      console.log('💰 Investment Made:', { proposalId, amount });
      return { success: true, amount: investmentAmount };
    } catch (error: any) {
      console.error('❌ Investment failed:', error);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  }, []);

  // Get proposal statistics
  const getProposalStats = useCallback(() => {
    const totalProposals = proposals.length;
    const pendingReview = proposals.filter(p => p.status === ProposalStatus.COMMITTEE_REVIEW).length;
    const approved = proposals.filter(p => p.status === ProposalStatus.APPROVED).length;
    const liveInvestments = proposals.filter(p => p.status === ProposalStatus.LIVE_INVESTMENT).length;
    const totalFunding = proposals.reduce((sum, p) => sum + Number(formatUnits(p.currentFunding, 6)), 0);

    return {
      totalProposals,
      pendingReview,
      approved,
      liveInvestments,
      totalFunding
    };
  }, [proposals]);

  // Mock data for demo
  useEffect(() => {
    // Add sample proposal for demo
    const sampleProposal: InvestmentProposal = {
      id: 1,
      submitter: address || getAddress("0x1234567890123456789012345678901234567890"),
      commodity: "Ethiopian Coffee Beans",
      amount: parseUnits("25000", 6),
      exporterName: "Highland Coffee Co.",
      status: ProposalStatus.COMMITTEE_REVIEW,
      documents: [
        {
          filename: "export_license.pdf",
          hash: "0xa1b2c3d4e5f6...",
          timestamp: Date.now() - 3600000,
          verified: true
        },
        {
          filename: "quality_certificate.pdf", 
          hash: "0xf6e5d4c3b2a1...",
          timestamp: Date.now() - 3600000,
          verified: true
        }
      ],
      chainlinkVerification: {
        ethPrice: 2420,
        usdcPrice: 1.001,
        marketRisk: 0.025,
        timestamp: Date.now() - 1800000,
        oracleSignature: "0x9876543210..."
      },
      committeeVotes: [
        {
          member: COMMITTEE_MEMBERS.LEAD_ANALYST,
          role: "LEAD ANALYST",
          vote: VoteType.APPROVE,
          reasoning: "Strong fundamentals, verified exporter credentials",
          timestamp: Date.now() - 900000,
          txHash: "0xabcd1234..."
        }
      ],
      targetFunding: parseUnits("21250", 6),
      currentFunding: BigInt(0),
      proposedAPR: 1200,
      finalAPR: 0,
      riskScore: 25,
      createdAt: Date.now() - 7200000
    };

    setProposals([sampleProposal]);
  }, [address]);

  return {
    // State
    proposals,
    loading,
    txHash,
    isCommitteeMember: isCommitteeMember(),
    committeeRole: getCommitteeRole(),
    
    // Actions
    submitProposal,
    triggerChainlinkVerification,
    submitCommitteeVote,
    openPublicInvestment,
    makeInvestment,
    
    // Utils
    getProposalStats,
    
    // Constants
    COMMITTEE_MEMBERS,
    ProposalStatus,
    VoteType
  };
}