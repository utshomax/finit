/**
 * @swagger
 * /api/v1/transactions/{id}/void:
 *   post:
 *     tags: [Transactions]
 *     summary: Void a transaction
 *     description: Marks a transaction as voided, effectively reversing it from balances.
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Transaction ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *                 maxLength: 500
 *                 description: Optional reason for voiding the transaction
 *     responses:
 *       200:
 *         description: Transaction voided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transaction:
 *                   $ref: '#/components/schemas/Transaction'
 *       404:
 *         description: Active transaction not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest } from "next/server";
import { requireActor } from "@/lib/server/auth";
import { collections } from "@/lib/server/db";
import { ApiError, handleRoute, ok, readJson, toObjectId } from "@/lib/server/http";
import { serializeTransaction } from "@/lib/server/serializers";
import { asObject, optionalString } from "@/lib/server/validation";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const actor = await requireActor(request, ["transactions:void"]);
    const transactionId = toObjectId((await params).id);
    const body = asObject(await readJson(request));
    const { transactions } = await collections();
    const transaction = await transactions.findOneAndUpdate(
      { _id: transactionId, userId: actor.userId, status: "active" },
      {
        $set: {
          status: "voided",
          voidedAt: new Date(),
          voidedByType: actor.type,
          voidedById: actor.actorId,
          voidReason: optionalString(body, "reason", 500),
          updatedAt: new Date(),
        },
      },
      { returnDocument: "after" },
    );

    if (!transaction) throw new ApiError(404, "not_found", "Active transaction not found");
    return ok({ transaction: serializeTransaction(transaction) });
  });
}
