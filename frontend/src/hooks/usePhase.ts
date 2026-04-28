export type VotingPhase = 'registration' | 'commit' | 'reveal' | 'ended'

export function getStepState(current: VotingPhase): Array<'done' | 'active' | 'pending'> {
  const order: VotingPhase[] = ['registration', 'commit', 'reveal', 'ended']
  const activeIndex = order.indexOf(current)

  return order.map((_, index) => {
    if (index < activeIndex) return 'done'
    if (index === activeIndex) return 'active'
    return 'pending'
  })
}
