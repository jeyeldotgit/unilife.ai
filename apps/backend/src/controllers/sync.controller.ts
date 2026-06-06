import type { SupabaseClient } from "@supabase/supabase-js";

import type { SyncPushItem } from "../services/sync.service.js";
import { SyncService } from "../services/sync.service.js";

export class SyncController {
  private readonly service: SyncService;

  constructor(supabase: SupabaseClient, userId: string) {
    this.service = new SyncService(supabase, userId);
  }

  async push(items: SyncPushItem[]) {
    return this.service.push(items);
  }
}
