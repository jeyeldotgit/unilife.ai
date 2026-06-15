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
    filters: { since?: string; from?: string; to?: string; from_at?: string; to_at?: string; category?: ExpenseCategory },
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
    if (filters.from_at) query = query.gte("spent_at", filters.from_at);
    if (filters.to_at) query = query.lte("spent_at", filters.to_at);

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

  async findByIdIncludingDeletedForUser(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("expenses")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
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

  async existsForOtherUserIncludingDeleted(id: string, userId: string) {
    const { data, error } = await this.supabase
      .from("expenses")
      .select("id")
      .eq("id", id)
      .neq("user_id", userId)
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

  async getActiveRefundTotal(userId: string, originalId: string) {
    const { data, error } = await this.supabase
      .from("expenses")
      .select("amount")
      .eq("user_id", userId)
      .eq("refund_of_expense_id", originalId)
      .is("deleted_at", null);
    if (error) throw new Error(error.message);
    return (data ?? []).reduce((sum, row) => sum + Number(row.amount), 0);
  }

  async hasActiveRefunds(userId: string, originalId: string) {
    const { count, error } = await this.supabase
      .from("expenses")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("refund_of_expense_id", originalId)
      .is("deleted_at", null);
    if (error) throw new Error(error.message);
    return (count ?? 0) > 0;
  }

  async updateForUser(id: string, userId: string, changes: Partial<Expense>) {
    const { data, error } = await this.supabase
      .from("expenses")
      .update(changes)
      .eq("id", id)
      .eq("user_id", userId)
      .is("deleted_at", null)
      .select()
      .single();
    if (error) {
      if (isNotFoundError(error)) return null;
      throw new Error(error.message);
    }
    return toExpense(data as DatabaseExpenseRow);
  }

  async upsert(record: Expense) {
    const { data, error } = await this.supabase
      .from("expenses")
      .upsert(record)
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
