export type User = { id: string; email: string; baseCurrency: string };
export type Account = {
  id: string;
  name: string;
  type: string;
  currency: string;
  openingBalanceMinor: number;
  balanceMinor?: number;
  status: "active" | "archived";
};
export type Category = {
  id: string;
  name: string;
  type: "income" | "expense" | "both";
  color?: string;
  icon?: string;
  status: "active" | "archived";
};
export type Transaction = {
  id: string;
  accountId: string;
  categoryId?: string;
  type: "income" | "expense" | "transfer";
  amountMinor: number;
  currency: string;
  destinationAccountId?: string;
  destinationAmountMinor?: number;
  destinationCurrency?: string;
  exchangeRate?: number;
  date?: string;
  note?: string;
  merchant?: string;
  status: "active" | "voided";
};
export type ApiKey = {
  id: string;
  label: string;
  prefix: string;
  scopes: string[];
  lastUsedAt?: string;
  revokedAt?: string;
  createdAt?: string;
};
export type Dashboard = {
  baseCurrency: string;
  netWorthMinor: number;
  monthly: { incomeMinor: number; expenseMinor: number };
  accounts: Account[];
  expenseByCategory: { categoryId: string; categoryName: string; currency: string; amountMinor: number }[];
  recentTransactions: Transaction[];
};
export type AppData = {
  dashboard?: Dashboard;
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  apiKeys: ApiKey[];
};
export type Tab = "overview" | "accounts" | "transactions" | "insights" | "categories" | "api" | "settings";
export type Period = "this_month" | "last_month" | "last_3_months" | "this_year" | "all_time";
export type Runner = (action: () => Promise<void>, success?: string) => Promise<void>;

export type InsightsCategoryItem = {
  categoryId: string;
  name: string;
  color?: string;
  amountMinor: number;
  currency: string;
  share: number;
  txnCount: number;
};

export type InsightsTrendMonth = {
  month: string;
  year: number;
  incomeMinor: number;
  expenseMinor: number;
};

export type InsightsTopTransaction = {
  id: string;
  merchant?: string;
  note?: string;
  categoryName?: string;
  amountMinor: number;
  currency: string;
  date?: string;
};

export type Insights = {
  baseCurrency: string;
  period: string;
  summary: {
    incomeMinor: number;
    expenseMinor: number;
    savedMinor: number;
    savingsRate: number;
    txnCount: number;
    incomeTxnCount: number;
    expenseTxnCount: number;
    avgExpenseMinor: number;
    dailyAvgExpenseMinor: number;
  };
  categoryBreakdown: InsightsCategoryItem[];
  monthlyTrend: InsightsTrendMonth[];
  topTransactions: InsightsTopTransaction[];
  vsPrevious: { incomeMinor: number; expenseMinor: number; savedMinor: number } | null;
};
