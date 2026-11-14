import { test, expect } from "@playwright/test";
import { stepSpring } from "../lib/signal";
import { T } from "../lib/tuning";

function simulateStep(dt: number, totalSeconds: number, target = 1) {
  let x = 0;
  let v = 0;
  let peak = 0;
  const steps = Math.round(totalSeconds / dt);

  for (let i = 0; i < steps; i++) {
    const next = stepSpring(x, v, target, dt);
    x = next.x;
    v = next.v;
    if (x > peak) {
      peak = x;
    }
  }

  return { peak, settled: x };
}

test.describe("C3: Underdamped spring unit test", () => {
  test("stepSpring is pure and does not mutate tuning T", () => {
    const tSnapshot = JSON.stringify(T);
    const res1 = stepSpring(0.2, 0.1, 1.0, 1 / 60);
    const res2 = stepSpring(0.2, 0.1, 1.0, 1 / 60);

    expect(res1).toEqual(res2);
    expect(typeof res1.x).toBe("number");
    expect(typeof res1.v).toBe("number");
    expect(JSON.stringify(T)).toBe(tSnapshot);
  });

  test("stepSpring overshoots and settles to <5% of peak inside 3 s at 1/60 s and 1/30 s steps", () => {
    const target = 1.0;
    const duration = 3.0; // 3 seconds

    const sim60 = simulateStep(1 / 60, duration, target);
    const sim30 = simulateStep(1 / 30, duration, target);

    // Assert: it overshoots (max value > target)
    expect(sim60.peak).toBeGreaterThan(target);
    expect(sim30.peak).toBeGreaterThan(target);

    // Assert: decays so that |x - target| < 5% of peak within 3 s
    const threshold60 = 0.05 * sim60.peak;
    const threshold30 = 0.05 * sim30.peak;

    expect(Math.abs(sim60.settled - target)).toBeLessThan(threshold60);
    expect(Math.abs(sim30.settled - target)).toBeLessThan(threshold30);

    // Assert: compare the two step rates on the peak and settled value (each within 10%)
    const peakRelativeDiff = Math.abs(sim60.peak - sim30.peak) / sim60.peak;
    expect(peakRelativeDiff).toBeLessThan(0.1);

    const settledRelativeDiff = Math.abs(sim60.settled - sim30.settled) / target;
    expect(settledRelativeDiff).toBeLessThan(0.1);
  });
});
