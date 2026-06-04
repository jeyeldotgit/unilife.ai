type SyncEngine = {
  start: () => void; // begin listening to connectivity
  stop: () => void; // stop listeners
  flush: () => Promise<void>; // manually trigger sync
};

// INTERNAL BEHAVIOUR OF SYNC ENGINE:
// start()
//   → listen to window.addEventListener("online")
//   → on online event: call flush()

// flush()
//   → query db.sync_queue where status = "pending"
//   → for each item (ordered by created_at ASC):
//       → set status = "syncing"
//       → POST to /api/trpc/sync.push with item payload
//       → on success: set status = "synced"
//       → on failure:
//           → increment retry_count
//           → if retry_count >= SYNC_RETRY_LIMIT: set status = "failed"
//           → else: set status = "pending"
