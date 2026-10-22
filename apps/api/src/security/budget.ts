import { sql } from "drizzle-orm";
import { db } from "../db/client.js";

export async function reserveBudget(
  scope: string,
  amountUsd: number,
): Promise<void> {
  const amount = formatReservation(amountUsd);

  const result = await db.execute(sql`
    UPDATE ai_budgets
    SET
      reserved_usd = reserved_usd + ${amount},
      updated_at = NOW()
    WHERE scope = ${scope}
      AND used_usd + reserved_usd + ${amount}
          <= limit_usd
    RETURNING scope
  `);

  if (result.rows.length === 0) {
    throw new Error("AI_BUDGET_EXCEEDED");
  }
}

export async function settleBudget(
  scope: string,
  reservedUsd: number,
  actualUsd: number,
): Promise<void> {
  const reservation = formatReservation(reservedUsd);

  if (!Number.isFinite(actualUsd) || actualUsd < 0) {
    throw new Error("INVALID_BUDGET_AMOUNT");
  }

  const actual = actualUsd.toFixed(8);
  const result = await db.execute(sql`
    UPDATE ai_budgets
    SET
      used_usd = used_usd + ${actual},
      reserved_usd = reserved_usd - ${reservation},
      updated_at = NOW()
    WHERE scope = ${scope}
      AND reserved_usd >= ${reservation}
    RETURNING scope
  `);

  if (result.rows.length === 0) {
    throw new Error("AI_BUDGET_RESERVATION_NOT_FOUND");
  }
}

export async function releaseBudget(
  scope: string,
  amountUsd: number,
): Promise<void> {
  const amount = formatReservation(amountUsd);
  const result = await db.execute(sql`
    UPDATE ai_budgets
    SET
      reserved_usd = reserved_usd - ${amount},
      updated_at = NOW()
    WHERE scope = ${scope}
      AND reserved_usd >= ${amount}
    RETURNING scope
  `);

  if (result.rows.length === 0) {
    throw new Error("AI_BUDGET_RESERVATION_NOT_FOUND");
  }
}

function formatReservation(amountUsd: number): string {
  if (!Number.isFinite(amountUsd) || amountUsd <= 0 || amountUsd > 1000) {
    throw new Error("INVALID_BUDGET_AMOUNT");
  }

  return amountUsd.toFixed(8);
}
