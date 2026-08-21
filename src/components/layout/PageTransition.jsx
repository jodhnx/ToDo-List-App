/**
 * Seitenwechsel ohne Flash:
 * - Kein AnimatePresence / mode="wait" (verhindert Zwischenbilder)
 * - Keine Exit-Animationen über alte Screens
 * - Sofortiger Inhalt, optional sehr kurzer Fade nur bei prefers-reduced-motion: no
 */
export default function PageTransition({ children }) {
  return <div className="page-view min-w-0">{children}</div>
}
