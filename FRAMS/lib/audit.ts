import { supabase } from './supabase';

export interface AuditLogItem {
  id: string;
  actor_id: string;
  actor_name?: string;
  action: string;
  target_table: string | null;
  target_id: string | null;
  metadata: any;      // consolidated schema: details → metadata
  ip_address: string | null;
  created_at: string;
}

export async function getAuditLogs(limit: number = 50): Promise<{ data: AuditLogItem[] | null; error: string | null }> {
  try {
    // Using audit_logs table (consolidated from admin_audit_log in 20260223 migration)
    const { data, error } = await supabase
      .from('audit_logs')    // consolidated schema: admin_audit_log → audit_logs
      .select(`
        *,
        actor:users(full_name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    const transformedData = data?.map(log => ({
      ...log,
      actor_name: (log.actor as any)?.full_name || 'System'
    })) || [];

    return { data: transformedData, error: null };
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    return { data: null, error: error.message || 'Failed to fetch audit logs' };
  }
}
