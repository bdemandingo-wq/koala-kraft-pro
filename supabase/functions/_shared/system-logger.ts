import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  level: LogLevel;
  source: string;
  message: string;
  details?: Record<string, unknown>;
  userId?: string;
  organizationId?: string;
  requestId?: string;
  stackTrace?: string;
}

/**
 * Log to the system_logs table from edge functions
 */
export async function logToSystem(entry: LogEntry): Promise<void> {
  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    await supabaseAdmin.from("system_logs").insert({
      level: entry.level,
      source: entry.source,
      message: entry.message,
      details: entry.details || null,
      user_id: entry.userId || null,
      organization_id: entry.organizationId || null,
      request_id: entry.requestId || null,
      stack_trace: entry.stackTrace || null,
    });
  } catch (err) {
    // Don't fail the function if logging fails
    console.error("Failed to log to system_logs:", err);
  }
}

/**
 * Create a standardized error response with logging
 */
export async function createErrorResponse(
  error: string,
  status: number,
  corsHeaders: Record<string, string>,
  logEntry?: Partial<LogEntry>
): Promise<Response> {
  // Log the error
  if (logEntry) {
    await logToSystem({
      level: 'error',
      source: logEntry.source || 'edge-function',
      message: error,
      details: logEntry.details,
      userId: logEntry.userId,
      organizationId: logEntry.organizationId,
      requestId: logEntry.requestId,
      stackTrace: logEntry.stackTrace,
    });
  }

  return new Response(JSON.stringify({ error }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

/**
 * Create a standardized success response
 */
export function createSuccessResponse(
  data: Record<string, unknown>,
  corsHeaders: Record<string, string>
): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
