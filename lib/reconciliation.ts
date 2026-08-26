import type { ReconciliationInput, ReconciliationResult } from "@/lib/types";

export function reconcilePayout(input: ReconciliationInput): ReconciliationResult {
  const expectedPayoutPence =
    input.grossAmountPence - input.refundAmountPence - input.feeAmountPence;
  const variancePence = input.actualPayoutPence - expectedPayoutPence;

  return {
    ...input,
    expectedPayoutPence,
    variancePence,
    status: variancePence === 0 ? "matched" : "exception",
  };
}

export function formatMoney(amountPence: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amountPence / 100);
}
