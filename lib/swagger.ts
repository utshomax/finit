import { createSwaggerSpec } from "next-swagger-doc";

export const getApiDocs = async () => {
  const spec = createSwaggerSpec({
    apiFolder: "app/api",
    definition: {
      openapi: "3.0.0",
      info: {
        title: "Finit API",
        version: "1.0.0",
        description: "Personal finance API for the Finit application",
      },
      components: {
        securitySchemes: {
          cookieAuth: {
            type: "apiKey",
            in: "cookie",
            name: "finit_session",
            description: "Session cookie obtained after login or registration",
          },
          apiKeyAuth: {
            type: "http",
            scheme: "bearer",
            bearerFormat: "API Key",
            description: "API key issued via /api/v1/api-keys",
          },
        },
        schemas: {
          Error: {
            type: "object",
            properties: {
              error: { type: "string", example: "validation_error" },
              message: { type: "string", example: "name is required" },
            },
          },
          User: {
            type: "object",
            properties: {
              id: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
              email: { type: "string", format: "email" },
              baseCurrency: { type: "string", example: "USD" },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          Account: {
            type: "object",
            properties: {
              id: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
              name: { type: "string", example: "Checking Account" },
              type: {
                type: "string",
                enum: ["checking", "savings", "credit", "investment", "cash", "other"],
              },
              currency: { type: "string", example: "USD" },
              openingBalanceMinor: { type: "integer", example: 100000 },
              balanceMinor: { type: "integer", example: 250000 },
              status: { type: "string", enum: ["active", "archived"] },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          Category: {
            type: "object",
            properties: {
              id: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
              name: { type: "string", example: "Groceries" },
              type: { type: "string", enum: ["income", "expense", "both"] },
              color: { type: "string", nullable: true, example: "#4CAF50" },
              icon: { type: "string", nullable: true, example: "shopping-cart" },
              status: { type: "string", enum: ["active", "archived"] },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          Transaction: {
            type: "object",
            properties: {
              id: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
              accountId: { type: "string" },
              categoryId: { type: "string", nullable: true },
              type: { type: "string", enum: ["income", "expense", "transfer"] },
              amountMinor: { type: "integer", example: 5000 },
              currency: { type: "string", example: "USD" },
              destinationAccountId: { type: "string", nullable: true },
              destinationAmountMinor: { type: "integer", nullable: true },
              destinationCurrency: { type: "string", nullable: true },
              exchangeRate: { type: "number", nullable: true },
              date: { type: "string", format: "date" },
              note: { type: "string", nullable: true },
              merchant: { type: "string", nullable: true },
              externalRef: { type: "string", nullable: true },
              idempotencyKey: { type: "string", nullable: true },
              metadata: { type: "object", nullable: true },
              status: { type: "string", enum: ["active", "voided"] },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
          ApiKey: {
            type: "object",
            properties: {
              id: { type: "string", example: "64a1b2c3d4e5f6a7b8c9d0e1" },
              label: { type: "string", example: "My Integration" },
              prefix: { type: "string", example: "fnk_live_abc1234" },
              scopes: {
                type: "array",
                items: { type: "string" },
                example: ["accounts:read", "transactions:read"],
              },
              revokedAt: { type: "string", format: "date-time", nullable: true },
              createdAt: { type: "string", format: "date-time" },
              updatedAt: { type: "string", format: "date-time" },
            },
          },
        },
      },
      security: [],
      tags: [
        { name: "Auth", description: "Authentication and session management" },
        { name: "Accounts", description: "Financial account management" },
        { name: "Categories", description: "Transaction category management" },
        { name: "Transactions", description: "Transaction management" },
        { name: "API Keys", description: "API key management" },
        { name: "Dashboard", description: "Dashboard summary data" },
        { name: "Insights", description: "Financial insights and analytics" },
      ],
    },
  });
  return spec;
};
