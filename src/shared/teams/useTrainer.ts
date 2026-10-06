import { useContext } from 'react';
import { TrainerContext } from './TrainerContext';

export const useTrainer = () => {
  const context = useContext(TrainerContext);
  if (!context) throw new Error(`useTrainer Requires TrainerProvider`);
  return context;
};
