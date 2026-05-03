import type { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { API_SCOPES, SESSION_COOKIE_NAME } from "./constants";
import { collections } from "./db";
import { ApiError } from "./http";
import { sha256 } from "./crypto";
import type { ApiScope, AuthActor } from "./types";

export async function getActor(request: NextRequest): Promise<AuthActor | null> {
  const sessionToken = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (sessionToken) {
    const tokenHash = sha256(sessionToken);
    const { sessions, users } = await collections();
    const session = await sessions.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
    if (session) {
      const user = await users.findOne({ _id: session.userId });
      if (user) {
        return {
          type: "user",
          userId: session.userId,
          actorId: session.userId,
          scopes: [...API_SCOPES],
        };
      }
    }
  }

  const authorization = request.headers.get("authorization");
  const [, rawKey] = authorization?.match(/^Bearer\s+(.+)$/i) ?? [];
  if (!rawKey) return null;

  const keyHash = sha256(rawKey);
  const { apiKeys } = await collections();
  const apiKey = await apiKeys.findOne({ keyHash, revokedAt: { $exists: false } });
  if (!apiKey) return null;

  await apiKeys.updateOne({ _id: apiKey._id }, { $set: { lastUsedAt: new Date() } });

  return {
    type: "api_key",
    userId: apiKey.userId,
    actorId: apiKey._id,
    scopes: apiKey.scopes,
  };
}

export async function requireActor(request: NextRequest, requiredScopes: ApiScope[] = []) {
  const actor = await getActor(request);
  if (!actor) {
    throw new ApiError(401, "unauthorized", "Authentication required");
  }

  for (const scope of requiredScopes) {
    if (!actor.scopes.includes(scope)) {
      throw new ApiError(403, "forbidden", `Missing required scope: ${scope}`);
    }
  }

  return actor;
}

export async function requireSessionUser(request: NextRequest) {
  const actor = await requireActor(request);
  if (actor.type !== "user") {
    throw new ApiError(403, "forbidden", "This endpoint requires a user session");
  }
  return actor;
}

export function actorMutationFields(actor: AuthActor) {
  return {
    createdByType: actor.type,
    createdById: new ObjectId(actor.actorId),
  };
}
