/**
 * @swagger
 * /api/v1/categories:
 *   get:
 *     tags: [Categories]
 *     summary: List all categories
 *     description: Returns all transaction categories for the authenticated user.
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 categories:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Category'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     tags: [Categories]
 *     summary: Create a category
 *     description: Creates a new transaction category.
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, type]
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 120
 *               type:
 *                 type: string
 *                 enum: [income, expense, both]
 *               color:
 *                 type: string
 *                 maxLength: 40
 *                 example: "#4CAF50"
 *               icon:
 *                 type: string
 *                 maxLength: 60
 *                 example: shopping-cart
 *     responses:
 *       201:
 *         description: Category created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   $ref: '#/components/schemas/Category'
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
import { collections } from "@/lib/server/db";
import { created, handleRoute, ok, readJson } from "@/lib/server/http";
import { serializeCategory } from "@/lib/server/serializers";
import { asObject, categoryTypeField, optionalString, stringField } from "@/lib/server/validation";

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const actor = await requireActor(request, ["categories:read"]);
    const { categories } = await collections();
    const docs = await categories.find({ userId: actor.userId }).sort({ createdAt: -1 }).toArray();
    return ok({ categories: docs.map(serializeCategory) });
  });
}

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const actor = await requireSessionUser(request);
    const body = asObject(await readJson(request));
    const now = new Date();
    const category = {
      _id: new ObjectId(),
      userId: actor.userId,
      name: stringField(body, "name", { max: 120 }),
      type: categoryTypeField(body),
      color: optionalString(body, "color", 40),
      icon: optionalString(body, "icon", 60),
      status: "active" as const,
      createdAt: now,
      updatedAt: now,
    };

    const { categories } = await collections();
    await categories.insertOne(category);
    return created({ category: serializeCategory(category) });
  });
}
