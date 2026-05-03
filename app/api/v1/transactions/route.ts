/**
 * @swagger
 * /api/v1/transactions:
 *   get:
 *     tags: [Transactions]
 *     summary: List transactions
 *     description: Returns transactions for the authenticated user with optional filters.
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, voided]
 *         description: Filter by transaction status
 *       - in: query
 *         name: accountId
 *         schema:
 *           type: string
 *         description: Filter by account ID
 *       - in: query
 *         name: categoryId
 *         schema:
 *           type: string
 *         description: Filter by category ID
 *       - in: query
 *         name: dateFrom
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions on or after this date
 *       - in: query
 *         name: dateTo
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter transactions on or before this date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           maximum: 500
 *         description: Maximum number of results (default 500)
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Transaction'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Transactions]
 *     summary: Create a transaction
 *     description: Creates a new income, expense, or transfer transaction. Supports idempotency via the `Idempotency-Key` header.
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: header
 *         name: Idempotency-Key
 *         schema:
 *           type: string
 *         description: Optional idempotency key to prevent duplicate transactions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [accountId, type, amountMinor, currency, date]
 *             properties:
 *               accountId:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [income, expense, transfer]
 *               amountMinor:
 *                 type: integer
 *                 minimum: 1
 *               currency:
 *                 type: string
 *                 example: USD
 *               categoryId:
 *                 type: string
 *                 description: Required for income/expense transactions
 *               destinationAccountId:
 *                 type: string
 *                 description: Required for transfer transactions
 *               destinationAmountMinor:
 *                 type: integer
 *                 description: Amount in destination account currency (for cross-currency transfers)
 *               exchangeRate:
 *                 type: number
 *                 description: Exchange rate for cross-currency transfers
 *               date:
 *                 type: string
 *                 format: date
 *               note:
 *                 type: string
 *                 maxLength: 500
 *               merchant:
 *                 type: string
 *                 maxLength: 160
 *               externalRef:
 *                 type: string
 *                 maxLength: 160
 *               idempotencyKey:
 *                 type: string
 *                 maxLength: 160
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Transaction created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *                 idempotent:
 *                   type: boolean
 *                   description: True if the response was returned from an idempotency cache
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Account or category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { actorMutationFields, requireActor } from "@/lib/server/auth";
import { collections } from "@/lib/server/db";
import { ApiError, created, handleRoute, ok, readJson, toObjectId } from "@/lib/server/http";
import { serializeTransaction } from "@/lib/server/serializers";
import {
  asObject,
  currencyField,
  dateField,
  integerField,
  metadataField,
  numberField,
  optionalString,
  stringField,
  transactionTypeField,
} from "@/lib/server/validation";

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const actor = await requireActor(request, ["transactions:read"]);
    const { searchParams } = new URL(request.url);
    const filter: Record<string, unknown> = { userId: actor.userId };

    if (searchParams.get("status")) filter.status = searchParams.get("status");
    if (searchParams.get("accountId")) {
      const accountId = toObjectId(searchParams.get("accountId")!, "accountId");
      filter.$or = [{ accountId }, { destinationAccountId: accountId }];
    }
    if (searchParams.get("categoryId")) filter.categoryId = toObjectId(searchParams.get("categoryId")!, "categoryId");
    if (searchParams.get("dateFrom") || searchParams.get("dateTo")) {
      const dateFilter: Record<string, Date> = {};
      if (searchParams.get("dateFrom")) dateFilter.$gte = new Date(searchParams.get("dateFrom")!);
      if (searchParams.get("dateTo")) {
        const to = new Date(searchParams.get("dateTo")!);
        to.setHours(23, 59, 59, 999);
        dateFilter.$lte = to;
      }
      filter.date = dateFilter;
    }

    const limit = searchParams.get("limit") ? Math.min(Number(searchParams.get("limit")), 500) : 500;
    const { transactions } = await collections();
    const docs = await transactions.find(filter).sort({ date: -1, createdAt: -1 }).limit(limit).toArray();

    return ok({ transactions: docs.map(serializeTransaction) });
  });
}

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const actor = await requireActor(request, ["transactions:write"]);
    const body = asObject(await readJson(request));
    const accountId = toObjectId(stringField(body, "accountId"), "accountId");
    const type = transactionTypeField(body);
    const currency = currencyField(body);
    const categoryId = type === "transfer" ? undefined : toObjectId(stringField(body, "categoryId"), "categoryId");
    const destinationAccountId = type === "transfer" ? toObjectId(stringField(body, "destinationAccountId"), "destinationAccountId") : undefined;
    const idempotencyKey = request.headers.get("idempotency-key") ?? optionalString(body, "idempotencyKey", 160);
    const { accounts, categories, transactions } = await collections();

    if (idempotencyKey) {
      const existing = await transactions.findOne({ userId: actor.userId, idempotencyKey });
      if (existing) return ok({ transaction: serializeTransaction(existing), idempotent: true });
    }

    const [account, category, destinationAccount] = await Promise.all([
      accounts.findOne({ _id: accountId, userId: actor.userId, status: "active" }),
      categoryId ? categories.findOne({ _id: categoryId, userId: actor.userId, status: "active" }) : Promise.resolve(null),
      destinationAccountId ? accounts.findOne({ _id: destinationAccountId, userId: actor.userId, status: "active" }) : Promise.resolve(null),
    ]);

    if (!account) throw new ApiError(404, "not_found", "Active account not found");
    if (currency !== account.currency) {
      throw new ApiError(400, "validation_error", "Transaction currency must match account currency");
    }

    const amountMinor = integerField(body, "amountMinor", { min: 1 });
    let destinationAmountMinor: number | undefined;
    let exchangeRate: number | undefined;
    if (type === "transfer") {
      if (!destinationAccountId || !destinationAccount) throw new ApiError(404, "not_found", "Active destination account not found");
      if (accountId.equals(destinationAccountId)) {
        throw new ApiError(400, "validation_error", "accountId and destinationAccountId must differ");
      }
      const explicitDestinationAmount = integerField(body, "destinationAmountMinor", { min: 1, optional: true });
      exchangeRate = numberField(body, "exchangeRate", { min: 0, optional: true });
      destinationAmountMinor = explicitDestinationAmount;
      if (account.currency === destinationAccount.currency) {
        destinationAmountMinor ??= amountMinor;
      } else if (!destinationAmountMinor && exchangeRate) {
        destinationAmountMinor = Math.round(amountMinor * exchangeRate);
      } else if (!destinationAmountMinor) {
        throw new ApiError(400, "validation_error", "Cross-currency transfers require destinationAmountMinor or exchangeRate");
      }
    } else {
      if (!category) throw new ApiError(404, "not_found", "Active category not found");
      if (category.type !== "both" && category.type !== type) {
        throw new ApiError(400, "validation_error", "Category type is not valid for this transaction");
      }
    }

    const now = new Date();
    const note = optionalString(body, "note", 500);
    const merchant = optionalString(body, "merchant", 160);
    const externalRef = optionalString(body, "externalRef", 160);
    const metadata = metadataField(body);
    const transaction = {
      _id: new ObjectId(),
      userId: actor.userId,
      accountId,
      ...(categoryId ? { categoryId } : {}),
      type,
      amountMinor,
      currency,
      ...(destinationAccountId ? { destinationAccountId } : {}),
      ...(destinationAmountMinor ? { destinationAmountMinor } : {}),
      ...(destinationAccount ? { destinationCurrency: destinationAccount.currency } : {}),
      ...(exchangeRate ? { exchangeRate } : {}),
      date: dateField(body),
      ...(note ? { note } : {}),
      ...(merchant ? { merchant } : {}),
      ...(externalRef ? { externalRef } : {}),
      ...(idempotencyKey ? { idempotencyKey } : {}),
      ...(metadata ? { metadata } : {}),
      status: "active" as const,
      ...actorMutationFields(actor),
      createdAt: now,
      updatedAt: now,
    };

    await transactions.insertOne(transaction);
    return created({ transaction: serializeTransaction(transaction) });
  });
}
