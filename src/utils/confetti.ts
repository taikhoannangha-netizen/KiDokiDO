import confetti from 'canvas-confetti';

export const triggerConfetti = (type: string = 'default') => {
  if (typeof window === 'undefined') return;

  try {
    if (type === 'levelUp') {
      const end = Date.now() + 2500;
      const interval: any = setInterval(() => {
        const timeLeft = end - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);

        const count = 50 * (timeLeft / 2500);
        confetti({
          particleCount: count,
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          origin: { x: Math.random(), y: Math.random() - 0.2 },
          zIndex: 9999,
          colors: ['#38bdf8', '#fbbf24', '#f43f5e', '#a855f7', '#10b981', '#ec4899'],
        });
      }, 250);
    } else if (type === 'lessonComplete') {
      const baseOrigin = { origin: { y: 0.7 }, zIndex: 9999 };
      const fire = (ratio: number, opts: confetti.Options) => {
        confetti({
          ...baseOrigin,
          ...opts,
          particleCount: Math.floor(100 * ratio),
        });
      };

      fire(0.25, { spread: 26, startVelocity: 55, colors: ['#38bdf8', '#3b82f6', '#f59e0b', '#10b981'] });
      fire(0.2, { spread: 60 });
      fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
      fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92 });
      fire(0.1, { spread: 120, startVelocity: 45 });
    } else if (type === 'starsAwarded') {
      confetti({
        particleCount: 60,
        spread: 80,
        origin: { y: 0.6 },
        zIndex: 9999,
        colors: ['#f59e0b', '#fbbf24', '#fef08a', '#38bdf8'],
        shapes: ['circle', 'square'],
        scalar: 1.2,
      });
    } else {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 9999,
      });
    }
  } catch (e) {
    console.warn('Failed to launch confetti:', e);
  }
};
