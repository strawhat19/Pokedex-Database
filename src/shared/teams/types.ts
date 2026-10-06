import { TeamRecord } from '../models';
import { VoteValue } from '../../types/types';

export interface TrainerSnapshot {
  accountId: string | null;
  teams: TeamRecord[];
  votes: Record<number, VoteValue>;
  voteTotals: Record<number, number>;
}

export type VoteLedger = Record<string, Record<number, VoteValue>>;
