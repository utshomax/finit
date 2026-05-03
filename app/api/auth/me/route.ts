/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user
 *     description: Returns the currently authenticated user's profile.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Current user profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest } from "next/server";
import { requireSessionUser } from "@/lib/server/auth";
import { collections } from "@/lib/server/db";
import { ApiError, handleRoute, ok } from "@/lib/server/http";
import { serializeUser } from "@/lib/server/serializers";

export async function GET(request: NextRequest) {
  return handleRoute(async () => {
    const actor = await requireSessionUser(request);
    const { users } = await collections();
    const user = await users.findOne({ _id: actor.userId });
    if (!user) {
      throw new ApiError(404, "not_found", "User not found");
    }
    return ok({ user: serializeUser(user) });
  });
}
