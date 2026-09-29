export function getStarsRequiredForLevel(level: number): number {
  return 100 + Math.max(0, Math.floor(level)) * 50;
}

export function getTotalStarsNeededForLevel(level: number): number {
  let total = 0;
  for (let i = 0; i < Math.max(0, level); i++) {
    total += getStarsRequiredForLevel(i);
  }
  return total;
}

export function getUserLevelAndXp(stars: number, level?: number, xp?: number) {
  const lvl = level !== undefined && level >= 0 ? Math.max(0, Math.floor(level)) : 0;
  const max = getStarsRequiredForLevel(lvl);
  let currentXp: number;
  if (xp !== undefined && xp >= 0) {
    currentXp = Math.min(max, xp);
  } else {
    const needed = getTotalStarsNeededForLevel(lvl);
    const remaining = Math.max(0, Math.floor(stars || 0) - needed);
    currentXp = Math.min(max, remaining);
  }
  const percent = Math.min(100, Math.max(0, Math.round((currentXp / max) * 100)));
  return { level: lvl, xp: currentXp, maxXp: max, percent };
}

export function calculateLevelAndXpFromStars(totalStars: number) {
  let lvl = 0;
  let remaining = Math.max(0, totalStars || 0);
  let req = getStarsRequiredForLevel(lvl);
  while (remaining >= req && req > 0) {
    remaining -= req;
    lvl++;
    req = getStarsRequiredForLevel(lvl);
  }
  const percent = Math.min(100, Math.max(0, Math.round((remaining / req) * 100)));
  return { level: lvl, xp: remaining, maxXp: req, percent };
}
