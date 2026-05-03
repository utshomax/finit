import type { Metadata } from "next";
import { FinitApp } from "./finit-app";

export const metadata: Metadata = {
  title: "Finit · Overview",
  description: "A clean personal finance dashboard for accounts, transactions, categories, and API keys.",
};

export default function HomePage() {
  return <FinitApp />;
}
