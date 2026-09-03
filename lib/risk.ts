export type RiskLevel = 'high' | 'medium' | 'low'

export interface RiskInput {
  faultCount7d: number
  uptime24h: number
  uptime7d: number
  uptime30d: number
  isOffline: boolean
}

export interface RiskResult {
  level: RiskLevel
  reasons: string[]
}

/**
 * Rule-based risk flagging — deliberately NOT a trained ML model. With two
 * test chargers and minimal real usage history, there's no real dataset to
 * train a genuine failure-prediction model on. These are transparent,
 * explainable heuristics over data the platform already has, not a
 * black-box prediction — worth keeping honest as real usage volume grows
 * and a genuine model becomes viable.
 */
export function calculateRisk(input: RiskInput): RiskResult {
  const reasons: string[] = []

  if (input.faultCount7d >= 3) {
    reasons.push(`${input.faultCount7d} faults in the last 7 days`)
  }
  if (input.uptime24h < 50) {
    reasons.push(`24h uptime is only ${input.uptime24h}%`)
  }
  if (input.isOffline) {
    reasons.push('currently offline')
  }

  if (reasons.length > 0) {
    return { level: 'high', reasons }
  }

  const mediumReasons: string[] = []
  if (input.faultCount7d >= 1) {
    mediumReasons.push(`${input.faultCount7d} fault${input.faultCount7d > 1 ? 's' : ''} in the last 7 days`)
  }
  // Meaningful decline vs the longer-term baseline, but only flag it if
  // there's enough 30d history for the comparison to mean anything.
  if (input.uptime30d > 0 && input.uptime7d < input.uptime30d - 20) {
    mediumReasons.push(`uptime dropped from ${input.uptime30d}% (30d) to ${input.uptime7d}% (7d)`)
  }

  if (mediumReasons.length > 0) {
    return { level: 'medium', reasons: mediumReasons }
  }

  return { level: 'low', reasons: [] }
}
