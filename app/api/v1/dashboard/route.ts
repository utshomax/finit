/**
 * @swagger
 * /api/v1/dashboard:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get dashboard summary
 *     description: Returns an aggregated financial summary including net worth, active accounts, monthly income/expense totals, top expense categories, and recent transactions.
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dashboard:
 *                   type: object
 *                   properties:
 *                     baseCurrency:
 *                       type: string
 *                     netWorthMinor:
 *                       type: integer
 *                     totalsByCurrency:
 *                       type: object
 *                       additionalProperties:
 *                         type: integer
 *                     missingConversionCurrencies:
 *                       type: array
 *                       items:
 *                         type: string
 *                     accounts:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Account'
 *                     monthly:
 *                       type: object
 *                       properties:
 *                         incomeMinor:
 *                           type: integer
 *                         expenseMinor:
 *                           type: integer
 *                     expenseByCategory:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           categoryId:
 *                             type: string
 *                           categoryName:
 *                             type: string
 *                           currency:
 *                             type: string
 *                           amountMinor:
 *                             type: integer
 *                     recentTransactions:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest } from "next/server";
import { requireActor } from "@/lib/server/auth";
import { accountBalanceMap } from "@/lib/server/balances";
import { collections } from "@/lib/server/db";
import { handleRoute, ok } from "@/lib/server/http";
import { serializeAccount, serializeTransaction } from "@/lib/server/serializers";

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const actor = await requireActor(request, ["dashboard:read"]);
    const { accounts, transactions, users, categories } = await collections();
    const user = await users.findOne({ _id: actor.userId });
    const baseCurrency = user?.baseCurrency ?? "USD";
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const [accountDocs, balances, monthlyRows, categoryRows, recentTransactions] = await Promise.all([
      accounts.find({ userId: actor.userId, status: "active" }).sort({ createdAt: -1 }).toArray(),
      accountBalanceMap(actor.userId),
      transactions
        .aggregate<{ _id: "income" | "expense"; amountMinor: number }>([
          { $match: { userId: actor.userId, status: "active", type: { $in: ["income", "expense"] }, date: { $gte: monthStart } } },
          { $group: { _id: "$type", amountMinor: { $sum: "$amountMinor" } } },
        ])
        .toArray(),
      transactions
        .aggregate<{ _id: { categoryId: unknown; currency: string }; amountMinor: number }>([
          { $match: { userId: actor.userId, status: "active", type: "expense", date: { $gte: monthStart } } },
          { $group: { _id: { categoryId: "$categoryId", currency: "$currency" }, amountMinor: { $sum: "$amountMinor" } } },
          { $sort: { amountMinor: -1 } },
          { $limit: 8 },
        ])
        .toArray(),
      transactions.find({ userId: actor.userId }).sort({ date: -1, createdAt: -1 }).limit(8).toArray(),
    ]);

    const accountSummaries = accountDocs.map((account) =>
      serializeAccount(account, balances.get(account._id.toString()) ?? account.openingBalanceMinor),
    );
    const totalsByCurrency = new Map<string, number>();
    let netWorthMinor = 0;
    const missingConversionCurrencies = new Set<string>();

    for (const account of accountDocs) {
      const balance = balances.get(account._id.toString()) ?? account.openingBalanceMinor;
      totalsByCurrency.set(account.currency, (totalsByCurrency.get(account.currency) ?? 0) + balance);
      if (account.currency === baseCurrency) {
        netWorthMinor += balance;
      } else {
        missingConversionCurrencies.add(account.currency);
      }
    }

    const monthly = { incomeMinor: 0, expenseMinor: 0 };
    for (const row of monthlyRows) {
      if (row._id === "income") monthly.incomeMinor = row.amountMinor;
      if (row._id === "expense") monthly.expenseMinor = row.amountMinor;
    }

    const categoryIds = categoryRows
      .map((row) => row._id.categoryId)
      .filter((categoryId): categoryId is import("mongodb").ObjectId => Boolean(categoryId));
    const categoryDocs = await categories.find({ _id: { $in: categoryIds }, userId: actor.userId }).toArray();
    const categoryNames = new Map(categoryDocs.map((category) => [category._id.toString(), category.name]));

    return ok({
      dashboard: {
        baseCurrency,
        netWorthMinor,
        totalsByCurrency: Object.fromEntries(totalsByCurrency),
        missingConversionCurrencies: [...missingConversionCurrencies],
        accounts: accountSummaries,
        monthly,
        expenseByCategory: categoryRows.map((row) => ({
          categoryId: String(row._id.categoryId),
          categoryName: categoryNames.get(String(row._id.categoryId)) ?? "Unknown",
          currency: row._id.currency,
          amountMinor: row.amountMinor,
        })),
        recentTransactions: recentTransactions.map(serializeTransaction),
      },
    });
  });
}
