/** Supabase-Fehler für Gruppen verständlich machen */
export function formatGroupError(err) {
  const msg = err?.message || String(err)
  const code = err?.code || ''

  if (code === '42P01' || /relation.*does not exist/i.test(msg)) {
    return 'Datenbank nicht eingerichtet. Führe supabase/migration_v4_families.sql im Supabase SQL Editor aus.'
  }
  if (/create_family_group/i.test(msg) && /function/i.test(msg)) {
    return 'Bitte zusätzlich migration_v4_families_fix.sql in Supabase ausführen.'
  }
  if (code === '42501' || /row-level security/i.test(msg)) {
    return 'Keine Berechtigung. migration_v4_families_fix.sql in Supabase ausführen und neu anmelden.'
  }
  if (/JWT|session|auth/i.test(msg)) {
    return 'Sitzung abgelaufen — bitte neu anmelden.'
  }
  return msg
}
