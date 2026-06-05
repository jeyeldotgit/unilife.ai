import type { SupabaseClient } from "@supabase/supabase-js";

export type AppBindings = {
  Variables: {
    supabase: SupabaseClient;
    userId: string;
  };
};
