/**
 * @swagger
 * /api/v1/api-keys/{id}/rotate:
 *   post:
 *     tags: [API Keys]
 *     summary: Rotate an API key
 *     description: Generates a new secret for an existing API key, invalidating the old one. The new raw key is returned only once.
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
 *         description: API key rotated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   $ref: '#/components/schemas/ApiKey'
 *                 rawKey:
 *                   type: string
 *                   description: The new raw key value. Store this securely — it is only shown once.
 *       404:
 *         description: API key not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest } from "next/server";
import { requireSessionUser } from "@/lib/server/auth";
import { createApiKeySecret, sha256 } from "@/lib/server/crypto";
import { collections } from "@/lib/server/db";
import { ApiError, handleRoute, ok, toObjectId } from "@/lib/server/http";
import { serializeApiKey } from "@/lib/server/serializers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const actor = await requireSessionUser(request);
    const apiKeyId = toObjectId((await params).id);
    const rawKey = createApiKeySecret();
    const { apiKeys } = await collections();
    const apiKey = await apiKeys.findOneAndUpdate(
      { _id: apiKeyId, userId: actor.userId },
      {
        $set: {
          keyHash: sha256(rawKey),
          prefix: rawKey.slice(0, 16),
          updatedAt: new Date(),
        },
        $unset: { revokedAt: "" },
      },
      { returnDocument: "after" },
    );
    if (!apiKey) throw new ApiError(404, "not_found", "API key not found");
    return ok({ apiKey: serializeApiKey(apiKey), rawKey });
  });
}
