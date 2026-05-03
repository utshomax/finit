/**
 * @swagger
 * /api/v1/accounts:
 *   get:
 *     tags: [Accounts]
 *     summary: List all accounts
 *     description: Returns all accounts belonging to the authenticated user, including current balances.
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accounts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Account'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Accounts]
 *     summary: Create an account
 *     description: Creates a new financial account for the authenticated user.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type, currency, openingBalanceMinor]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 120
 *               type:
 *                 type: string
 *                 enum: [checking, savings, credit, investment, cash, other]
 *               currency:
 *                 type: string
 *                 example: USD
 *               openingBalanceMinor:
 *                 type: integer
 *                 minimum: 0
 *                 example: 100000
 *     responses:
 *       201:
 *         description: Account created
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { requireActor, requireSessionUser } from "@/lib/server/auth";
import { accountBalanceMap } from "@/lib/server/balances";
import { collections } from "@/lib/server/db";
import { created, handleRoute, ok, readJson } from "@/lib/server/http";
import { serializeAccount } from "@/lib/server/serializers";
import {
  accountTypeField,
  asObject,
  currencyField,
  integerField,
  stringField,
} from "@/lib/server/validation";

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const actor = await requireActor(request, ["accounts:read"]);
    const { accounts } = await collections();
    const [docs, balances] = await Promise.all([
      accounts.find({ userId: actor.userId }).sort({ createdAt: -1 }).toArray(),
      accountBalanceMap(actor.userId),
    ]);

    return ok({
      accounts: docs.map((account) => serializeAccount(account, balances.get(account._id.toString()))),
    });
  });
}

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const actor = await requireSessionUser(request);
    const body = asObject(await readJson(request));
    const now = new Date();
    const account = {
      _id: new ObjectId(),
      userId: actor.userId,
      name: stringField(body, "name", { max: 120 }),
      type: accountTypeField(body),
      currency: currencyField(body),
      openingBalanceMinor: integerField(body, "openingBalanceMinor", { min: 0 }),
      status: "active" as const,
      createdAt: now,
      updatedAt: now,
    };

    const { accounts } = await collections();
    await accounts.insertOne(account);

    return created({ account: serializeAccount(account, account.openingBalanceMinor) });
  });
}
