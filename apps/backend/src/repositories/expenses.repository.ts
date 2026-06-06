import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense, ExpenseCategory } from "@unilife-ai/types";

type DatabaseExpenseRow = Omit<Expense, "amount"> & {
  amount: number | string;
};

function isNotFoundError(error: { code?: string } | null) {
  return error?.code === "PGRST116";
}

function toExpense(record: DatabaseExpenseRow): Expense {
  return {
    ...record,
    amount: Number(record.amount),
  };
}

function toStartOfUtcDay(value: string) {
  return `${value}T00:00:00.000Z`;
}

function toEndOfUtcDay(value: string) {
  return `${value}T23:59:59.999Z`;
}

export class ExpensesRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async listForUser(
    userId: string,
    filters: { since?: string; from?: string; to?: string; category?: ExpenseCategory },
  ) {
    let query = this.supabase
      .from("expenses")
      .select("*")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (filters.since) {
      query = query.gt("updated_at", filters.since);
    }

    if (filters.from) {
      query = query.gte("spent_at", toStartOfUtcDay(filters.from));
    }

    if (filters.to) {
      query = query.lte("spent_at", toEndOfUtcDay(filters.to));
    }

    if (filters.category) {
      query = query.eq("category", filters.category);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(error.message);
    }

    return (data ?? []).map((record) => toExpense(record as DatabaseExpenseRow));
  }

  async findByIdForUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return null;
      }

      throw new Error(error.message);
    }

    return toExpense(data as DatabaseExpenseRow);
  }

  async existsForOtherUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("expenses")
      .select("id")
      .eq("id", id)
      .neq("user_id", userId)
      .is("deleted_at", null)
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return false;
      }

      throw new Error(error.message);
    }

    return Boolean(data);
  }

  async create(record: Expense) {
    const { data, error } = await this.supabase
      .from("expenses")
      .insert(record)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return toExpense(data as DatabaseExpenseRow);
  }

  async softDeleteForUser(id: string, userId: string, deletedAt: string) {
    const { data, error } = await this.supabase
      .from("expenses")
      .update({ deleted_at: deletedAt })
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select("id")
      .single();

    if (error) {
      if (isNotFoundError(error)) {
        return false;
      }

      throw new Error(error.message);
    }

    return Boolean(data);
  }
}
