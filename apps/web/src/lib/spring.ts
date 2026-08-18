"use client";

import { useEffect, useRef } from "react";

export type SpringConfig = {
  stiffness: number;
  damping: number;
  mass?: number;
  precision?: number;
};

export type Spring = { value: number; target: number; velocity: number };

const MAX_STEP = 0.004;

export function createSpring(value = 0): Spring {
  return { value, target: value, velocity: 0 };
}

export function advanceSpring(
  spring: Spring,
  elapsed: number,
  config: SpringConfig,
) {
  const mass = config.mass ?? 1;
  const precision = config.precision ?? 0.04;
  const steps = Math.max(1, Math.ceil(elapsed / MAX_STEP));
  const step = elapsed / steps;

  for (let index = 0; index < steps; index += 1) {
    const pull = -config.stiffness * (spring.value - spring.target);
    const drag = -config.damping * spring.velocity;
    spring.velocity += ((pull + drag) / mass) * step;
    spring.value += spring.velocity * step;
  }

  const settled =
    Math.abs(spring.value - spring.target) < precision &&
    Math.abs(spring.velocity) < precision;

  if (settled) {
    spring.value = spring.target;
    spring.velocity = 0;
  }

  return settled;
}

export function dampingFor(stiffness: number, ratio: number, mass = 1) {
  return ratio * 2 * Math.sqrt(stiffness * mass);
}

export function useSpringValue(
  target: number,
  config: SpringConfig,
  apply: (value: number) => void,
) {
  const spring = useRef(createSpring(target));
  const frame = useRef(0);
  const last = useRef(0);
  const applyRef = useRef(apply);
  const configRef = useRef(config);

  useEffect(() => {
    applyRef.current = apply;
    configRef.current = config;
  });

  useEffect(
    () => () => {
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    },
    [],
  );

  useEffect(() => {
    spring.current.target = target;
    cancelAnimationFrame(frame.current);

    last.current = performance.now();

    function tick(now: number) {
      const elapsed = Math.min((now - last.current) / 1000, 0.064);
      last.current = now;

      const settled = advanceSpring(spring.current, elapsed, configRef.current);
      applyRef.current(spring.current.value);

      if (settled) {
        frame.current = 0;
        return;
      }
      frame.current = requestAnimationFrame(tick);
    }

    frame.current = requestAnimationFrame(tick);
  }, [target]);
}
