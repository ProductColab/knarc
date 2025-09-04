"use client";
import * as React from "react";

type SliderProps = {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
};

export function Slider({
  value,
  min = 0,
  max = 10,
  step = 0.5,
  onChange,
}: SliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full"
    />
  );
}
