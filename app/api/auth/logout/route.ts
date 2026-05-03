/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Log out
 *     description: Invalidates the current session and clears the session cookie.
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       204:
 *         description: Logged out successfully
 */
import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE_NAME } from "@/lib/server/constants";
import { collections } from "@/lib/server/db";
import { handleRoute, noContent } from "@/lib/server/http";
import { sha256 } from "@/lib/server/crypto";

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
    if (token) {
      const { sessions } = await collections();
      await sessions.deleteOne({ tokenHash: sha256(token) });
    }

    const response = noContent() as NextResponse;
    response.cookies.set(SESSION_COOKIE_NAME, "", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 0,
    });
    return response;
  });
}
