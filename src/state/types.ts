export type Resources = {
  budget: number; // oyun puanı; gerçek para değil
  foodWasteKg: number; // senaryoda ölçülen/tahmini kg
  energyScore: number; // 0..100 oyun göstergesi
  waterScore: number; // 0..100 oyun göstergesi
  wellbeing: number; // 0..100 oyun göstergesi
};

export type Choice = {
  id: string;
  label: string;
  deltas: Partial<Resources>;
  tradeoff: string;
};

export type Scenario = {
  id: string;
  version: string;
  baseline: Resources;
  choices: Choice[];
  learningOutcomeIds: string[];
  evidenceRefs: string[];
};

export type DecisionResult = {
  scenarioId: string;
  choiceId: string;
  before: Resources;
  after: Resources;
  reasoning?: string;
  modelVersion: string;
};
