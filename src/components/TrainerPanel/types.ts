import { TeamPokemon } from '../../shared/models';

export type TrainerPanelView = `signin` | `signup` | `profile` | `teams`;
export interface TrainerPanelProps {
  view: TrainerPanelView | null;
  onClose: () => void;
  onViewChange?: (view: TrainerPanelView) => void;
  pendingPokemon?: TeamPokemon | null;
  onAuthenticated?: () => void | Promise<void>;
}
