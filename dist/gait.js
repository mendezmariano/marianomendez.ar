// One full left/right cycle. Tuned against the 598.8–600.1 s gameplay sample.
export const CYCLE_DISTANCE = 96;
export const DEPTH_RATIO = .45;
const THIGH = 27;
const SHIN = 27;
const HIP_Y = -49;
const ANKLE_Y = -4;
const fraction = value => ((value % 1) + 1) % 1;

function bendKnee(hip, ankle) {
  const dx = ankle[0] - hip[0], dy = ankle[1] - hip[1];
  const distance = Math.hypot(dx, dy);
  const along = (THIGH * THIGH - SHIN * SHIN + distance * distance) / (2 * distance);
  const forward = Math.sqrt(Math.max(0, THIGH * THIGH - along * along));
  return [hip[0] + dx / distance * along + dy / distance * forward,
    hip[1] + dy / distance * along - dx / distance * forward];
}

// Stance travels backwards at the body's exact speed. Swing returns the foot
// forward above the floor; bending the knee is independent of horizontal travel.
function footCycle(phase, scale) {
  const support = phase < .5;
  const swing = (phase - .5) * 2;
  const progress = support ? phase * 2 : swing * swing;
  const travel = (support ? 1 - 2 * progress : -1 + 2 * progress) * CYCLE_DISTANCE / (4 * scale);
  return { support, travel, lift: support ? 0 : 10 * Math.sin(Math.PI * swing),
    angle: support ? 0 : .42 * Math.cos(Math.PI * swing) };
}

export function sampleGait(character, scale = 1, reducedMotion = false) {
  const { facing, stride, walking, greeting } = character;
  const profile = facing === 'left' || facing === 'right';
  const moving = walking && !greeting && !reducedMotion;
  const phase = fraction(stride);
  const bodyY = moving ? 1.1 * Math.cos(phase * Math.PI * 4) : 0;
  const legs = [-1, 1].map(side => {
    const local = fraction(phase + (side < 0 ? .5 : 0));
    const foot = moving ? footCycle(local, scale) : { support: true, travel: 0, lift: 0, angle: 0 };
    const hip = [side * (profile ? 2 : 6), HIP_Y + bodyY];
    const ankle = profile
      ? [moving ? foot.travel : side * 4, ANKLE_Y - foot.lift]
      : [side * 6, ANKLE_Y + foot.travel * DEPTH_RATIO * (facing === 'back' ? -1 : 1) - foot.lift * .55];
    const knee = moving && profile ? bendKnee(hip, ankle)
      : [hip[0], -26 + bodyY * .5 + (ankle[1] - ANKLE_Y) * .45];
    return { side, hip, knee, ankle, support: foot.support, angle: profile ? foot.angle : 0 };
  });
  const arms = [-1, 1].map(side => {
    const local = fraction(phase + (side < 0 ? .5 : 0));
    const swing = moving ? -Math.cos(local * Math.PI * 2) : 0;
    const shoulder = [side * 9, -77];
    const elbow = [side * 11 + (profile ? swing * 5 : 0), -62];
    const hand = [side * 11 + (profile ? swing * 13 : swing), -47 - Math.max(0, swing) * (profile ? 5 : 3)];
    return { side, shoulder, elbow, hand };
  });
  return { bodyY, legs, arms };
}
