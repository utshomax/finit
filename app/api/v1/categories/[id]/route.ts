/**
 * @swagger
 * /api/v1/categories/{id}:
 *   get:
 *     tags: [Categories]
 *     summary: Get a category
 *     description: Returns a single category by ID.
 *     security:
 *       - cookieAuth: []
 *       - apiKeyAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   patch:
 *     tags: [Categories]
 *     summary: Update a category
 *     description: Partially updates a category's name, type, color, or icon.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
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
 *                 enum: [income, expense, both]
 *               color:
 *                 type: string
 *                 nullable: true
 *               icon:
 *                 type: string
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Category updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 category:
 *                   $ref: '#/components/schemas/Category'
 *       404:
 *         description: Category not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest } from "next/server";
import { requireActor, requireSessionUser } from "@/lib/server/auth";
import { collections } from "@/lib/server/db";
import { ApiError, handleRoute, ok, readJson, toObjectId } from "@/lib/server/http";
import { serializeCategory } from "@/lib/server/serializers";
import { asObject, categoryTypeField, optionalString, stringField } from "@/lib/server/validation";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const actor = await requireActor(request, ["categories:read"]);
    const categoryId = toObjectId((await params).id);
    const { categories } = await collections();
    const category = await categories.findOne({ _id: categoryId, userId: actor.userId });
    if (!category) throw new ApiError(404, "not_found", "Category not found");
    return ok({ category: serializeCategory(category) });
  });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const actor = await requireSessionUser(request);
    const categoryId = toObjectId((await params).id);
    const body = asObject(await readJson(request));
    const update: Record<string, unknown> = { updatedAt: new Date() };
    if (body.name != null) update.name = stringField(body, "name", { max: 120 });
    if (body.type != null) update.type = categoryTypeField(body);
    if (body.color !== undefined) update.color = optionalString(body, "color", 40);
    if (body.icon !== undefined) update.icon = optionalString(body, "icon", 60);

    const { categories } = await collections();
    const category = await categories.findOneAndUpdate(
      { _id: categoryId, userId: actor.userId },
      { $set: update },
      { returnDocument: "after" },
    );
    if (!category) throw new ApiError(404, "not_found", "Category not found");
    return ok({ category: serializeCategory(category) });
  });
}
