import preprodData from '@/public/preprod_50_users_feedback.json';

export interface UserFeedbackRecord {
  index: number;
  name: string;
  email: string;
  role: string;
  organization: string;
  walletAddress: string;
  transactionHash: string;
  blockHeight: number;
  explorer1AmUrl: string;
  explorerMidnightUrl: string;
  contractAddress: string;
  featureTested: string;
  rating: number;
  feedback: string;
  timestamp: string;
  status: string;
}

export const FEEDBACK_RECORDS: UserFeedbackRecord[] = preprodData as UserFeedbackRecord[];
