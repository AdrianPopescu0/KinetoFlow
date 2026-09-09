/** True când nu există exerciții de azi sau fiecare id e în lista de completări. */
export function allExercisesCompleted(
  exerciseIds: readonly string[],
  completedIds: Iterable<string>,
): boolean {
  if (exerciseIds.length === 0) {
    return true
  }
  const done = new Set(completedIds)
  return exerciseIds.every((id) => id.length > 0 && done.has(id))
}

export const CHECKIN_REQUIRES_EXERCISES_MESSAGE =
  "Marchează toate exercițiile de azi ca efectuate, apoi trimite check-in-ul."
