/**
 * @swagger
 * /api/v1/accounts/{id}/archive:
 *   post:
 *     tags: [Accounts]
 *     summary: Archive an account
 *     description: Sets the account status to archived.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Account ID
 *     responses:
 *       200:
 *         description: Account archived
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
 */
import { NextRequest } from "next/server";
import { requireSessionUser } from "@/lib/server/auth";
import { collections } from "@/lib/server/db";
import { ApiError, handleRoute, ok, toObjectId } from "@/lib/server/http";
import { serializeAccount } from "@/lib/server/serializers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const actor = await requireSessionUser(request);
    const accountId = toObjectId((await params).id);
    const { accounts } = await collections();
    const account = await accounts.findOneAndUpdate(
      { _id: accountId, userId: actor.userId },
      { $set: { status: "archived", updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!account) throw new ApiError(404, "not_found", "Account not found");
    return ok({ account: serializeAccount(account) });
  });
}
