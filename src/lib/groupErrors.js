/** Supabase-Fehler für Gruppen verständlich machen */
export function formatGroupError(err) {
  const msg = err?.message || String(err)
  const code = err?.code || ''

  if (code === '42P01' || /relation.*does not exist/i.test(msg)) {
    return 'Datenbank nicht eingerichtet. Bitte die neuesten Supabase-Migrationen im SQL Editor ausführen.'
  }
  if (/create_family_group/i.test(msg) && /function/i.test(msg)) {
    return 'Bitte zusätzlich migration_v4_families_fix.sql in Supabase ausführen.'
  }
  if (/update_family_group|set_group_member_role|remove_group_member/i.test(msg) && /function|schema cache/i.test(msg)) {
    return 'Gruppenverwaltung noch nicht aktualisiert. Bitte migration_v9_group_management.sql in Supabase ausführen.'
  }
  if (/notify_enabled|reminder_at|reminder_repeat|reminder_early|reminder_sound/i.test(msg)) {
    return 'Gruppenerinnerungen sind in der Datenbank noch nicht aktiviert. Bitte migration_v10_shared_task_reminders.sql ausführen.'
  }
  if (/description|avatar_url|invite_code|completed_by|completed_at/i.test(msg)) {
    return 'Familienprofil und Aktivitätsdaten sind noch nicht aktiviert. Bitte migration_v11_family_polish.sql ausführen.'
  }
  if (code === '42501' || /row-level security/i.test(msg)) {
    return 'Keine Berechtigung. Bitte prüfen, ob du Oberadmin bist und die neuesten Gruppen-Migrationen ausgeführt wurden.'
  }
  if (/JWT|session|auth/i.test(msg)) {
    return 'Sitzung abgelaufen - bitte neu anmelden.'
  }
  return msg
}
