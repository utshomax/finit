/**
 * @swagger
 * /api/v1/insights:
 *   get:
 *     tags: [Insights]
 *     summary: Get financial insights
 *     description: Returns detailed financial analytics for a given period, including cashflow summary, category breakdown, monthly trends, top transactions, and comparison to the previous period.
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [this_month, last_month, last_3_months, this_year]
 *           default: this_month
 *         description: The time period to analyse
 *     responses:
 *       200:
 *         description: Insights data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 insights:
 *                   type: object
 *                   properties:
 *                     baseCurrency:
 *                       type: string
 *                     period:
 *                       type: string
 *                     summary:
 *                       type: object
 *                       properties:
 *                         incomeMinor:
 *                           type: integer
 *                         expenseMinor:
 *                           type: integer
 *                         savedMinor:
 *                           type: integer
 *                         savingsRate:
 *                           type: integer
 *                         txnCount:
 *                           type: integer
 *                         avgExpenseMinor:
 *                           type: integer
 *                         dailyAvgExpenseMinor:
 *                           type: integer
 *                     categoryBreakdown:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           categoryId:
 *                             type: string
 *                           name:
 *                             type: string
 *                           color:
 *                             type: string
 *                             nullable: true
 *                           amountMinor:
 *                             type: integer
 *                           currency:
 *                             type: string
 *                           share:
 *                             type: integer
 *                           txnCount:
 *                             type: integer
 *                     monthlyTrend:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           month:
 *                             type: string
 *                           year:
 *                             type: integer
 *                           incomeMinor:
 *                             type: integer
 *                           expenseMinor:
 *                             type: integer
 *                     topTransactions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           merchant:
 *                             type: string
 *                             nullable: true
 *                           note:
 *                             type: string
 *                             nullable: true
 *                           categoryName:
 *                             type: string
 *                             nullable: true
 *                           amountMinor:
 *                             type: integer
 *                           currency:
 *                             type: string
 *                           date:
 *                             type: string
 *                             format: date-time
 *                     vsPrevious:
 *                       nullable: true
 *                       type: object
 *                       properties:
 *                         incomeMinor:
 *                           type: integer
 *                         expenseMinor:
 *                           type: integer
 *                         savedMinor:
 *                           type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest } from "next/server";
import { requireActor } from "@/lib/server/auth";
import { collections } from "@/lib/server/db";
import { handleRoute, ok } from "@/lib/server/http";
import { getPeriodBounds } from "@/lib/utils";
import type { Period } from "@/lib/types";
import type { ObjectId } from "mongodb";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function toDateFilter(from: Date | null, to: Date | null) {
  if (!from && !to) return {};
  const f: Record<string, Date> = {};
  if (from) f.$gte = from;
  if (to) f.$lte = to;
  return { date: f };
}

function previousBounds(period: Period): { from: Date; to: Date } | null {
  const now = new Date();
  if (period === "this_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 1, 1),
      to: new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999),
    };
  }
  if (period === "last_month") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 2, 1),
      to: new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59, 999),
    };
  }
  if (period === "last_3_months") {
    return {
      from: new Date(now.getFullYear(), now.getMonth() - 5, 1),
      to: new Date(now.getFullYear(), now.getMonth() - 2, 0, 23, 59, 59, 999),
    };
  }
  if (period === "this_year") {
    return {
      from: new Date(now.getFullYear() - 1, 0, 1),
      to: new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999),
    };
  }
  return null;
}

function elapsedDays(from: Date | null, to: Date | null): number {
  const end = to ?? new Date();
  const start = from ?? new Date(end.getFullYear(), 0, 1);
  return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86_400_000));
}

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const actor = await requireActor(request, ["dashboard:read"]);
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get("period") ?? "this_month") as Period;

    const { transactions, categories, users } = await collections();
    const user = await users.findOne({ _id: actor.userId });
    const baseCurrency = user?.baseCurrency ?? "GBP";

    const { from, to } = getPeriodBounds(period);
    const base = { userId: actor.userId, status: "active" as const };
    const periodMatch = { ...base, ...toDateFilter(from, to) };

    // Always show last 6 calendar months for the trend chart
    const trendStart = new Date();
    trendStart.setUTCMonth(trendStart.getUTCMonth() - 5);
    trendStart.setUTCDate(1);
    trendStart.setUTCHours(0, 0, 0, 0);

    const prev = previousBounds(period);

    const [cashflowRows, categoryRows, topTxnDocs, trendRows, prevRows] = await Promise.all([
      // Period cashflow totals
      transactions
        .aggregate<{ _id: "income" | "expense"; amountMinor: number; count: number }>([
          { $match: { ...periodMatch, type: { $in: ["income", "expense"] } } },
          { $group: { _id: "$type", amountMinor: { $sum: "$amountMinor" }, count: { $sum: 1 } } },
        ])
        .toArray(),

      // Period category breakdown (expenses only)
      transactions
        .aggregate<{ _id: { categoryId: ObjectId | null; currency: string }; amountMinor: number; count: number }>([
          { $match: { ...periodMatch, type: "expense" } },
          {
            $group: {
              _id: { categoryId: { $ifNull: ["$categoryId", null] }, currency: "$currency" },
              amountMinor: { $sum: "$amountMinor" },
              count: { $sum: 1 },
            },
          },
          { $sort: { amountMinor: -1 } },
          { $limit: 10 },
        ])
        .toArray(),

      // Top 5 biggest expense transactions in period
      transactions.find({ ...periodMatch, type: "expense" }).sort({ amountMinor: -1 }).limit(5).toArray(),

      // Last 6 months income/expense for trend chart
      transactions
        .aggregate<{ _id: { year: number; month: number; type: string }; amountMinor: number }>([
          { $match: { ...base, type: { $in: ["income", "expense"] }, date: { $gte: trendStart } } },
          {
            $group: {
              _id: { year: { $year: "$date" }, month: { $month: "$date" }, type: "$type" },
              amountMinor: { $sum: "$amountMinor" },
            },
          },
          { $sort: { "_id.year": 1, "_id.month": 1 } },
        ])
        .toArray(),

      // Previous equivalent period cashflow for delta comparison
      prev
        ? transactions
            .aggregate<{ _id: "income" | "expense"; amountMinor: number }>([
              { $match: { ...base, ...toDateFilter(prev.from, prev.to), type: { $in: ["income", "expense"] } } },
              { $group: { _id: "$type", amountMinor: { $sum: "$amountMinor" } } },
            ])
            .toArray()
        : Promise.resolve([]),
    ]);

    // --- Summary ---
    let incomeMinor = 0;
    let expenseMinor = 0;
    let incomeTxnCount = 0;
    let expenseTxnCount = 0;
    for (const r of cashflowRows) {
      if (r._id === "income") { incomeMinor = r.amountMinor; incomeTxnCount = r.count; }
      if (r._id === "expense") { expenseMinor = r.amountMinor; expenseTxnCount = r.count; }
    }
    const txnCount = incomeTxnCount + expenseTxnCount;
    const savedMinor = incomeMinor - expenseMinor;
    const savingsRate = incomeMinor > 0 ? Math.round((savedMinor / incomeMinor) * 100) : (expenseMinor > 0 ? -100 : 0);
    const avgExpenseMinor = expenseTxnCount > 0 ? Math.round(expenseMinor / expenseTxnCount) : 0;
    const dailyAvgExpenseMinor = Math.round(expenseMinor / elapsedDays(from, to));

    // --- Category breakdown ---
    const catIds = categoryRows
      .map((r) => r._id.categoryId)
      .filter((id): id is ObjectId => id !== null);
    const catDocs = await categories.find({ _id: { $in: catIds }, userId: actor.userId }).toArray();
    const catNames = new Map(catDocs.map((c) => [c._id.toString(), c.name]));
    const catColors = new Map(catDocs.map((c) => [c._id.toString(), c.color]));
    const totalCatExpense = categoryRows.reduce((s, r) => s + r.amountMinor, 0);

    const categoryBreakdown = categoryRows.map((r) => {
      const catKey = r._id.categoryId?.toString() ?? "";
      return {
        categoryId: catKey || "uncategorised",
        name: catKey ? (catNames.get(catKey) ?? "Unknown") : "Uncategorised",
        color: catKey ? catColors.get(catKey) : undefined,
        amountMinor: r.amountMinor,
        currency: r._id.currency,
        share: totalCatExpense > 0 ? Math.round((r.amountMinor / totalCatExpense) * 100) : 0,
        txnCount: r.count,
      };
    });

    // --- Monthly trend (6 slots) ---
    const trendMap = new Map<string, { month: string; year: number; incomeMinor: number; expenseMinor: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setUTCMonth(d.getUTCMonth() - i);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
      trendMap.set(key, { month: MONTH_NAMES[d.getUTCMonth()], year: d.getUTCFullYear(), incomeMinor: 0, expenseMinor: 0 });
    }
    for (const r of trendRows) {
      const key = `${r._id.year}-${r._id.month}`;
      const slot = trendMap.get(key);
      if (!slot) continue;
      if (r._id.type === "income") slot.incomeMinor = r.amountMinor;
      if (r._id.type === "expense") slot.expenseMinor = r.amountMinor;
    }
    const monthlyTrend = Array.from(trendMap.values());

    // --- Top transactions ---
    const topTransactions = topTxnDocs.map((t) => ({
      id: t._id.toString(),
      merchant: t.merchant,
      note: t.note,
      categoryName: t.categoryId ? (catNames.get(t.categoryId.toString()) ?? "Unknown") : undefined,
      amountMinor: t.amountMinor,
      currency: t.currency,
      date: t.date?.toISOString(),
    }));

    // --- vs previous period ---
    let vsPrevious: { incomeMinor: number; expenseMinor: number; savedMinor: number } | null = null;
    if (prevRows.length > 0) {
      let pi = 0;
      let pe = 0;
      for (const r of prevRows) {
        if (r._id === "income") pi = r.amountMinor;
        if (r._id === "expense") pe = r.amountMinor;
      }
      vsPrevious = { incomeMinor: pi, expenseMinor: pe, savedMinor: pi - pe };
    }

    return ok({
      insights: {
        baseCurrency,
        period,
        summary: { incomeMinor, expenseMinor, savedMinor, savingsRate, txnCount, incomeTxnCount, expenseTxnCount, avgExpenseMinor, dailyAvgExpenseMinor },
        categoryBreakdown,
        monthlyTrend,
        topTransactions,
        vsPrevious,
      },
    });
  });
}
