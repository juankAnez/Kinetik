import API from "./client";
import type { Transaction, Wallet } from "../../types/models";

export const PaymentsAPI = {
  async listTransactions(): Promise<Transaction[]> {
    const { data } = await API.get<{ results: Transaction[] }>(
      "/payments/transactions/",
    );
    return data.results ?? [];
  },
};

export const WalletAPI = {
  async getMyWallet(): Promise<Wallet> {
    const { data } = await API.get<Wallet>("/payments/wallet/");
    return data;
  },
};
