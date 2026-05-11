export type {
  Cadence,
  ReviewState,
  ConfidenceBand,
  PriceStep,
  Subscription,
  DetectionResult,
  DetectionMeta,
} from './detection.types';
export { confidenceBand, annualizedCost } from './detection.types';
export { normalizeMerchant } from './normalize';
export { inferCadence } from './cadence';
export type { CadenceInference } from './cadence';
export { computeStability } from './stability';
export type { StabilityResult } from './stability';
export { findPriceSteps } from './trajectory';
export { computeConfidence } from './confidence';
export { detectSubscriptions } from './detect';
