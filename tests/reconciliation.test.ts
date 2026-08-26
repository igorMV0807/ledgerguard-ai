import { describe, expect, it } from "vitest";
import { reconcilePayout } from "../lib/reconciliation";

describe("reconcilePayout", () => {
  it("marks an exact payout as matched", () => {
    const result = reconcilePayout({
      grossAmountPence: 12_000,
      refundAmountPence: 2_000,
      feeAmountPence: 350,
      actualPayoutPence: 9_650,
    });

    expect(result.expectedPayoutPence).toBe(9_650);
    expect(result.variancePence).toBe(0);
    expect(result.status).toBe("matched");
  });

  it("opens an exception when the payout is lower than expected", () => {
    const result = reconcilePayout({
      grossAmountPence: 12_000,
      refundAmountPence: 2_000,
      feeAmountPence: 350,
      actualPayoutPence: 7_650,
    });

    expect(result.expectedPayoutPence).toBe(9_650);
    expect(result.variancePence).toBe(-2_000);
    expect(result.status).toBe("exception");
  });

  it("keeps all calculations in integer minor units", () => {
    const result = reconcilePayout({
      grossAmountPence: 10_001,
      refundAmountPence: 1,
      feeAmountPence: 333,
      actualPayoutPence: 9_667,
    });

    expect(result.expectedPayoutPence).toBe(9_667);
    expect(result.variancePence).toBe(0);
  });
});
