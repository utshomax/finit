/**
 * @swagger
 * /api/v1/api-keys:
 *   get:
 *     tags: [API Keys]
 *     summary: List API keys
 *     description: Returns all API keys for the authenticated user.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: List of API keys
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKeys:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ApiKey'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [API Keys]
 *     summary: Create an API key
 *     description: Creates a new API key. The raw key is only returned once at creation time.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [label, scopes]
 *             properties:
 *               label:
 *                 type: string
 *                 maxLength: 120
 *                 example: My Integration
 *               scopes:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["accounts:read", "transactions:read", "transactions:write"]
 *     responses:
 *       201:
 *         description: API key created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiKey:
 *                   $ref: '#/components/schemas/ApiKey'
 *                 rawKey:
 *                   type: string
 *                   description: The full API key value. Store this securely — it is only shown once.
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { requireSessionUser } from "@/lib/server/auth";
import { createApiKeySecret, sha256 } from "@/lib/server/crypto";
import { collections } from "@/lib/server/db";
import { created, handleRoute, ok, readJson } from "@/lib/server/http";
import { serializeApiKey } from "@/lib/server/serializers";
import { asObject, scopesField, stringField } from "@/lib/server/validation";

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const actor = await requireSessionUser(request);
    const { apiKeys } = await collections();
    const docs = await apiKeys.find({ userId: actor.userId }).sort({ createdAt: -1 }).toArray();
    return ok({ apiKeys: docs.map(serializeApiKey) });
  });
}

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const actor = await requireSessionUser(request);
    const body = asObject(await readJson(request));
    const rawKey = createApiKeySecret();
    const now = new Date();
    const apiKey = {
      _id: new ObjectId(),
      userId: actor.userId,
      label: stringField(body, "label", { max: 120 }),
      keyHash: sha256(rawKey),
      prefix: rawKey.slice(0, 16),
      scopes: scopesField(body),
      createdAt: now,
      updatedAt: now,
    };

    const { apiKeys } = await collections();
    await apiKeys.insertOne(apiKey);
    return created({ apiKey: serializeApiKey(apiKey), rawKey });
  });
}
