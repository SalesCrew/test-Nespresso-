export type AssignmentLike = {
  id: string
  location_text?: string | null
  postal_code?: string | null
  city?: string | null
}

export type MarketLike = {
  id: string
  name?: string | null
  address?: string | null
  plz?: string | null
  city?: string | null
}

export function normalizeForMatch(input: string): string {
  return input
    .normalize('NFD')
    // remove diacritics
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    // replace punctuation with space; keep digits and letters
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenize(input: string | null | undefined): string[] {
  if (!input) return []
  return normalizeForMatch(input).split(' ').filter(Boolean)
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1
  let inter = 0
  for (const t of a) if (b.has(t)) inter++
  const union = a.size + b.size - inter
  if (union === 0) return 0
  return inter / union
}

export function scoreAssignmentToMarket(assignment: AssignmentLike, market: MarketLike): number {
  const aPlz = (assignment.postal_code || '').trim()
  const mPlz = (market.plz || '').trim()
  const aCity = normalizeForMatch(assignment.city || assignment.location_text || '')
  const mCity = normalizeForMatch(market.city || '')

  const aNameTokens = new Set(tokenize(assignment.location_text))
  const aAddrTokens = new Set(tokenize(assignment.location_text))
  const mNameTokens = new Set(tokenize(market.name))
  const mAddrTokens = new Set(tokenize(market.address))

  let score = 0
  if (aPlz && mPlz && aPlz === mPlz) score += 60
  if (aCity && mCity && aCity === mCity) score += 20

  // Name overlap
  score += Math.round(jaccard(aNameTokens, mNameTokens) * 15)
  // Address overlap
  score += Math.round(jaccard(aAddrTokens, mAddrTokens) * 5)

  return score
}

export function computeBestMarket(
  assignment: AssignmentLike,
  markets: MarketLike[],
): { market: MarketLike | null; score: number } {
  let best: MarketLike | null = null
  let bestScore = -1
  for (const m of markets) {
    const s = scoreAssignmentToMarket(assignment, m)
    if (s > bestScore) {
      best = m
      bestScore = s
    } else if (s === bestScore && best) {
      // tie-breaker: prefer with PLZ+City exact
      const aPlz = (assignment.postal_code || '').trim()
      const mPlzBest = (best.plz || '').trim()
      const mPlzCur = (m.plz || '').trim()
      const aCity = normalizeForMatch(assignment.city || assignment.location_text || '')
      const bestCity = normalizeForMatch(best.city || '')
      const curCity = normalizeForMatch(m.city || '')
      const bestHasBoth = aPlz && mPlzBest && aPlz === mPlzBest && aCity && bestCity && aCity === bestCity
      const curHasBoth = aPlz && mPlzCur && aPlz === mPlzCur && aCity && curCity && aCity === curCity
      if (!bestHasBoth && curHasBoth) {
        best = m
      } else if (bestHasBoth === curHasBoth) {
        // deterministic fallback: alphabetical by name
        const bestName = (best.name || '').toLowerCase()
        const curName = (m.name || '').toLowerCase()
        if (curName < bestName) best = m
      }
    }
  }
  return { market: best, score: bestScore }
}

// Optional helper for candidate selection; kept simple for clarity
export function selectCandidates(
  assignment: AssignmentLike,
  markets: MarketLike[],
): MarketLike[] {
  const byPlz = markets.filter(m => (m.plz || '').trim() === (assignment.postal_code || '').trim())
  if (byPlz.length) return byPlz
  const cityKey = normalizeForMatch(String(assignment.city || assignment.location_text || ''))
  const byCity = markets.filter(m => normalizeForMatch(String(m.city || '')) === cityKey)
  return byCity.length ? byCity : markets
}


