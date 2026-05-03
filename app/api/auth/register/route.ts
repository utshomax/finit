/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: Creates a new user account and sets a session cookie.
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
 *                 minLength: 8
 *               baseCurrency:
 *                 type: string
 *                 example: USD
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { DEFAULT_BASE_CURRENCY, SESSION_COOKIE_NAME } from "@/lib/server/constants";
import { collections } from "@/lib/server/db";
import { hashPassword, randomToken, sha256 } from "@/lib/server/crypto";
import { ApiError, created, handleRoute, readJson } from "@/lib/server/http";
import { serializeUser } from "@/lib/server/serializers";
import { asObject, optionalCurrency, stringField } from "@/lib/server/validation";

const SESSION_DAYS = 30;

export async function POST(request: NextRequest) {
  return handleRoute(async () => {
    const body = asObject(await readJson(request));
    const email = stringField(body, "email", { max: 320 }).toLowerCase();
    const password = stringField(body, "password", { max: 256 });
    const baseCurrency = optionalCurrency(body, "baseCurrency") ?? DEFAULT_BASE_CURRENCY;

    if (password.length < 8) {
      throw new ApiError(400, "validation_error", "password must be at least 8 characters");
    }

    const now = new Date();
    const { users, sessions } = await collections();
    const user = {
      _id: new ObjectId(),
      email,
      passwordHash: await hashPassword(password),
      baseCurrency,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await users.insertOne(user);
    } catch {
      throw new ApiError(409, "conflict", "Email is already registered");
    }

    const token = randomToken();
    await sessions.insertOne({
      _id: new ObjectId(),
      userId: user._id,
      tokenHash: sha256(token),
      expiresAt: new Date(now.getTime() + SESSION_DAYS * 24 * 60 * 60 * 1000),
      createdAt: now,
    });

    const response = created({ user: serializeUser(user) }) as NextResponse;
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
