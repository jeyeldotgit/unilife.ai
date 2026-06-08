import type { ComponentPropsWithoutRef, CSSProperties } from "react";

type IconProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  name: string;
  filled?: boolean;
};

export function Icon({
  name,
  filled = false,
  className = "",
  style,
  ...props
}: IconProps) {
  return (
    <span
      {...props}
      className={`material-symbols-outlined ${className}`.trim()}
      style={{
        fontVariationSettings: filled
          ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24"
          : "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24",
        ...(style as CSSProperties),
      }}
    >
      {name}
    </span>
  );
}
