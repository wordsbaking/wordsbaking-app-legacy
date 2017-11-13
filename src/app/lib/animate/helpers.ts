export function momentum(
  current: number,
  start: number,
  end: number,
  time: number,
) {
  let distance = current - start;
  let speed = Math.abs(distance) / time;
  let destination: number;
  let duration: number;
  let deceleration = 0.0006;

  destination =
    current + speed * speed / (2 * deceleration) * (distance < 0 ? -1 : 1);
  duration = speed / deceleration;

  if (destination < end) {
    destination = end;
    distance = Math.abs(destination - current);
    duration = distance / speed;
  } else if (destination > 0) {
    destination = 0;
    distance = Math.abs(current) + destination;
    duration = distance / speed;
  }

  return {
    destination: Math.round(destination),
    duration,
  };
}
