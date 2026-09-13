// Repair persisted inventory data before main.js initializes.
// Older records with an empty/invalid pack ID triggered a TDZ ReferenceError
// inside normalizePackId() while the module was initializing.
try {
  const key = 'mp12-inventory-v4'
  const raw = localStorage.getItem(key)
  if (raw) {
    const data = JSON.parse(raw)
    if (Array.isArray(data.packs)) {
      let fallback = 1
      data.packs = data.packs.map((pack) => {
        const value = String(pack?.id ?? '').trim().toUpperCase()
        if (/^P-26-\d{3}$/.test(value)) return { ...pack, id: value }
        const old = value.match(/^P-(?:2026-)?(\d{1,4})$/)
        if (old) return { ...pack, id: `P-26-${String(old[1]).padStart(3, '0')}` }
        while (data.packs.some((p) => p !== pack && p?.id === `P-26-${String(fallback).padStart(3, '0')}`)) fallback++
        const id = `P-26-${String(fallback).padStart(3, '0')}`
        fallback++
        return { ...pack, id }
      })
      localStorage.setItem(key, JSON.stringify(data))
    }
  }
} catch (error) {
  console.warn('[MP12] persisted DB repair skipped:', error)
}
