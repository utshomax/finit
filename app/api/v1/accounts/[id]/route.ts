/**
 * @swagger
 * /api/v1/accounts/{id}:
 *   get:
 *     tags: [Accounts]
 *     summary: Get an account
 *     description: Returns a single account by ID with its current balance.
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Account found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 account:
 *                   $ref: '#/components/schemas/Account'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     tags: [Accounts]
 *     summary: Update an account
 *     description: Partially updates an account's name, type, opening balance, or currency.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 120
 *               type:
 *                 type: string
 *                 enum: [checking, savings, credit, investment, cash, other]
 *               openingBalanceMinor:
 *                 type: integer
 *                 minimum: 0
 *               currency:
 *                 type: string
 *                 example: USD
 *     responses:
 *       200:
 *         description: Account updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 account:
 *                   $ref: '#/components/schemas/Account'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Account not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Conflict (e.g. currency change blocked by existing events)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest } from "next/server";
import { requireActor, requireSessionUser } from "@/lib/server/auth";
import { accountBalanceMap, accountHasEvents } from "@/lib/server/balances";
import { collections } from "@/lib/server/db";
import { ApiError, handleRoute, ok, readJson, toObjectId } from "@/lib/server/http";
import { serializeAccount } from "@/lib/server/serializers";
import {
  accountTypeField,
  asObject,
  currencyField,
  integerField,
  stringField,
} from "@/lib/server/validation";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const actor = await requireActor(request, ["accounts:read"]);
    const accountId = toObjectId((await params).id);
    const { accounts } = await collections();
    const account = await accounts.findOne({ _id: accountId, userId: actor.userId });
    if (!account) throw new ApiError(404, "not_found", "Account not found");
    const balances = await accountBalanceMap(actor.userId);
    return ok({ account: serializeAccount(account, balances.get(account._id.toString())) });
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const actor = await requireSessionUser(request);
    const accountId = toObjectId((await params).id);
    const body = asObject(await readJson(request));
    const { accounts } = await collections();
    const account = await accounts.findOne({ _id: accountId, userId: actor.userId });
    if (!account) throw new ApiError(404, "not_found", "Account not found");

    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name != null) update.name = stringField(body, "name", { max: 120 });
    if (body.type != null) update.type = accountTypeField(body);
    if (body.openingBalanceMinor != null) {
      update.openingBalanceMinor = integerField(body, "openingBalanceMinor", { min: 0 });
    }
    if (body.currency != null) {
      const currency = currencyField(body);
      if (currency !== account.currency && (await accountHasEvents(actor.userId, accountId))) {
        throw new ApiError(409, "conflict", "Account currency cannot be changed after events exist");
      }
      update.currency = currency;
    }

    const result = await accounts.findOneAndUpdate(
      { _id: accountId, userId: actor.userId },
      { $set: update },
      { returnDocument: "after" },
    );
    if (!result) throw new ApiError(404, "not_found", "Account not found");

    const balances = await accountBalanceMap(actor.userId);
    return ok({ account: serializeAccount(result, balances.get(result._id.toString())) });
  });
}
