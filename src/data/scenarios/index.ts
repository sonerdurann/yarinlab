import food001 from './food_001.json';
import type { Choice, Scenario } from '../../state/types';

export type FoodScenario = Omit<Scenario, 'choices'> & {
  title: string;
  brief: string;
  context: { students: number; mealDemand: number; budgetLabel: string; goal: string };
  choices: (Choice & { summary: string })[];
  disclaimer: string;
  reasoningOptions: string[];
  transferQuestion: string;
};

export const food = food001 as FoodScenario;

export const scenarios: Record<string, Scenario> = { food_001: food };
