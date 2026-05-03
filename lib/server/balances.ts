import type { ObjectId } from "mongodb";
import { collections } from "./db";

type BalanceDelta = {
  _id: ObjectId;
  amount: number;
};

export async function accountBalanceMap(userId: ObjectId) {
  const { accounts, transactions } = await collections();
  const accountDocs = await accounts.find({ userId }).toArray();
  const balances = new Map<string, number>();

  for (const account of accountDocs) {
    balances.set(account._id.toString(), account.openingBalanceMinor);
  }

  const transactionDeltas = await transactions
    .aggregate<BalanceDelta>([
      { $match: { userId, status: "active" } },
      {
        $group: {
          _id: "$accountId",
          amount: {
            $sum: {
              $switch: {
                branches: [
                  { case: { $eq: ["$type", "income"] }, then: "$amountMinor" },
                  { case: { $eq: ["$type", "expense"] }, then: { $multiply: ["$amountMinor", -1] } },
                  { case: { $eq: ["$type", "transfer"] }, then: { $multiply: ["$amountMinor", -1] } },
                ],
                default: 0,
              },
            },
          },
        },
      },
    ])
    .toArray();

  for (const delta of transactionDeltas) {
    const key = delta._id.toString();
    balances.set(key, (balances.get(key) ?? 0) + delta.amount);
  }

  const incoming = await transactions
    .aggregate<BalanceDelta>([
      { $match: { userId, status: "active", type: "transfer" } },
      { $group: { _id: "$destinationAccountId", amount: { $sum: "$destinationAmountMinor" } } },
    ])
    .toArray();

  for (const delta of incoming) {
    const key = delta._id.toString();
    balances.set(key, (balances.get(key) ?? 0) + delta.amount);
  }

  return balances;
}

export async function accountHasEvents(userId: ObjectId, accountId: ObjectId) {
  const { transactions } = await collections();
  const transaction = await transactions.findOne(
    {
      userId,
      $or: [{ accountId }, { destinationAccountId: accountId }],
    },
    { projection: { _id: 1 } },
  );

  return Boolean(transaction);
}
