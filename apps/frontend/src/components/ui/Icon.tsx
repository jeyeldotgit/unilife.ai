import type { ComponentPropsWithoutRef, CSSProperties } from "react";

type IconProps = Omit<ComponentPropsWithoutRef<"span">, "children"> & {
  name: string;
  filled?: boolean;
  size?: number | string;
};

export function Icon({
  name,
  filled = false,
  size,
  className = "",
  style,
  ...props
}: IconProps) {
  const opticalSize = typeof size === "number" ? size : 24;

  return (
    <span
      {...props}
      className={`material-symbols-outlined ${className}`.trim()}
      style={{
        fontVariationSettings: filled
          ? `'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' ${opticalSize}`
          : `'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' ${opticalSize}`,
        ...(size !== undefined ? { fontSize: size } : {}),
        ...(style as CSSProperties),
      }}
    >
      {name}
    </span>
  );
}
