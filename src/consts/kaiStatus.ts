export const KAI_STATUS = {
  MANUAL_INVALID_NORISK: "invalid - norisk",
  AI_INVALID_NORISK: "ai-invalid-norisk"
} as const;

export type KaiStatusValue = (typeof KAI_STATUS)[keyof typeof KAI_STATUS];
