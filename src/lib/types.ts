export type TransactionType = "income" | "expense";
export type SourceChannel = "website" | "telegram" | "gmail" | "ocr" | "api";
export type ParsedStatus = "pending" | "parsed" | "reviewed" | "failed";

export interface Transaction {
  id: string;
  user_id: string;
  transaction_type: TransactionType;
  item_name: string | null;
  category: string | null;
  merchant_name: string | null;
  transaction_date: string;
  amount: number;
  currency: string;
  payment_method: string | null;
  account_name: string | null;
  location: string | null;
  invoice_number: string | null;
  source_channel: SourceChannel;
  source_reference: string | null;
  notes: string | null;
  attachment_url: string | null;
  attachment_path: string | null;
  tags: string[] | null;
  recurring_flag: boolean;
  recurring_period: string | null;
  confidence_score: number | null;
  parsed_status: ParsedStatus;
  reviewed_by_user: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  kind: TransactionType;
  color: string | null;
  icon: string | null;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  kind: string | null;
  currency: string | null;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  currency: string;
  icon: string | null;
  color: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
