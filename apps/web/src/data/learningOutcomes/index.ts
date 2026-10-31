import { LEARNING_OUTCOMES } from '@yarinlab/shared';

/** Kazanımlar ortak içerikten gelir (packages/shared/src/content). */
export const learningOutcomes = Object.entries(LEARNING_OUTCOMES).map(([id, text]) => ({ id, text }));
