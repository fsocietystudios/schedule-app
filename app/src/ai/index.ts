import { useAppStore } from '@/store/useAppStore';
import { localEngine } from './localEngine';
import { remoteEngine } from './remoteEngine';
import { AiEngine } from './types';

export function getAiEngine(): AiEngine {
  const mode = useAppStore.getState().settings.aiEngine;
  return mode === 'remote' ? remoteEngine : localEngine;
}

export * from './types';
