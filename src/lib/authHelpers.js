/** E-Mail für Login/Register vereinheitlichen */
export function normalizeEmail(email) {
  return (email || '').trim().toLowerCase()
}
