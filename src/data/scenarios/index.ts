import food001 from './food_001.json';
import type { Scenario } from '../../state/types';

export const food: Scenario & {
  title: string;
  brief: string;
  disclaimer: string;
  reasoningOptions: string[];
  transferQuestion: string;
} = food001 as never;

export const scenarios: Record<string, Scenario> = { food_001: food };
