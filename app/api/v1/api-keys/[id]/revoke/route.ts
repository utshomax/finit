/**
 * @swagger
 * /api/v1/api-keys/{id}/revoke:
 *   post:
 *     tags: [API Keys]
 *     summary: Revoke an API key
 *     description: Marks an API key as revoked so it can no longer be used for authentication.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: API key ID
 *     responses:
 *       200:
 *         description: API key revoked
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   $ref: '#/components/schemas/ApiKey'
 *       404:
 *         description: API key not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest } from "next/server";
import { requireSessionUser } from "@/lib/server/auth";
import { collections } from "@/lib/server/db";
import { ApiError, handleRoute, ok, toObjectId } from "@/lib/server/http";
import { serializeApiKey } from "@/lib/server/serializers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const actor = await requireSessionUser(request);
    const apiKeyId = toObjectId((await params).id);
    const { apiKeys } = await collections();
    const apiKey = await apiKeys.findOneAndUpdate(
      { _id: apiKeyId, userId: actor.userId },
      { $set: { revokedAt: new Date(), updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!apiKey) throw new ApiError(404, "not_found", "API key not found");
    return ok({ apiKey: serializeApiKey(apiKey) });
  });
}
