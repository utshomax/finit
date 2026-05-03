/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Log in with email and password
 *     description: Authenticates a user and sets a session cookie.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { SESSION_COOKIE_NAME } from "@/lib/server/constants";
import { collections } from "@/lib/server/db";
import { randomToken, sha256, verifyPassword } from "@/lib/server/crypto";
import { ApiError, handleRoute, ok, readJson } from "@/lib/server/http";
import { serializeUser } from "@/lib/server/serializers";
import { asObject, stringField } from "@/lib/server/validation";

const SESSION_DAYS = 30;

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const body = asObject(await readJson(request));
    const email = stringField(body, "email", { max: 320 }).toLowerCase();
    const password = stringField(body, "password", { max: 256 });
    const { users, sessions } = await collections();
    const user = await users.findOne({ email });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      throw new ApiError(401, "unauthorized", "Invalid email or password");
    }

    const now = new Date();
    const token = randomToken();
    await sessions.insertOne({
      _id: new ObjectId(),
      userId: user._id,
      tokenHash: sha256(token),
      expiresAt: new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000),
      createdAt: now,
    });

    const response = ok({ user: serializeUser(user) }) as NextResponse;
    response.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_DAYS * 24 * 60 * 60,
    });
    return response;
  });
}
