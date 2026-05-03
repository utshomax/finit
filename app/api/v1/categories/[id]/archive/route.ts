/**
 * @swagger
 * /api/v1/categories/{id}/archive:
 *   post:
 *     tags: [Categories]
 *     summary: Archive a category
 *     description: Sets the category status to archived.
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Category ID
 *     responses:
 *       200:
 *         description: Category archived
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
import { requireSessionUser } from "@/lib/server/auth";
import { collections } from "@/lib/server/db";
import { ApiError, handleRoute, ok, toObjectId } from "@/lib/server/http";
import { serializeCategory } from "@/lib/server/serializers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handleRoute(async () => {
    const actor = await requireSessionUser(request);
    const categoryId = toObjectId((await params).id);
    const { categories } = await collections();
    const category = await categories.findOneAndUpdate(
      { _id: categoryId, userId: actor.userId },
      { $set: { status: "archived", updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!category) throw new ApiError(404, "not_found", "Category not found");
    return ok({ category: serializeCategory(category) });
  });
}
