import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Logs an admin action for accountability. Call this whenever an admin
 * does something impactful: ban/unban, delete a match, recalculate or
 * reset ratings, etc.
 *
 * Failures here are swallowed (logged to console only) — a broken audit
 * log should never block the actual admin action from completing.
 */
export async function logAdminAction(
  supabase: SupabaseClient,
  adminUsername: string,
  action: string,
  details?: Record<string, unknown>
) {
  try {
    await supabase.from("admin_audit_log").insert({
      admin_username: adminUsername,
      action,
      details: details ?? null,
    });
  } catch (err) {
    console.error("Failed to write audit log entry:", err);
  }
}
