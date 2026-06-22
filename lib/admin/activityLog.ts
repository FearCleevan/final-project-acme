import supabaseAdmin from '@/lib/supabase'

export type ActivityEntityType = 'review' | 'product' | 'content' | 'order'

export interface ActivityLogEntry {
  id:          string
  action:      string
  entityType:  ActivityEntityType
  entityId:    string | null
  entityLabel: string | null
  metadata:    Record<string, unknown> | null
  createdAt:   string
}

export async function logAction(
  action:       string,
  entityType:   ActivityEntityType,
  entityId?:    string,
  entityLabel?: string,
  metadata?:    Record<string, unknown>
): Promise<void> {
  await supabaseAdmin.from('admin_activity_log').insert({
    action,
    entity_type:  entityType,
    entity_id:    entityId    ?? null,
    entity_label: entityLabel ?? null,
    metadata:     metadata    ?? null,
  })
}

function toEntry(row: Record<string, unknown>): ActivityLogEntry {
  return {
    id:          row.id           as string,
    action:      row.action       as string,
    entityType:  row.entity_type  as ActivityEntityType,
    entityId:    row.entity_id    as string | null,
    entityLabel: row.entity_label as string | null,
    metadata:    row.metadata     as Record<string, unknown> | null,
    createdAt:   row.created_at   as string,
  }
}

export async function getActivityLog(
  limit      = 50,
  offset     = 0,
  entityType?: ActivityEntityType
): Promise<ActivityLogEntry[]> {
  let q = supabaseAdmin
    .from('admin_activity_log')
    .select('*')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (entityType) q = q.eq('entity_type', entityType)

  const { data } = await q
  return (data ?? []).map(row => toEntry(row as Record<string, unknown>))
}
