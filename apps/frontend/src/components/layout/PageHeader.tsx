import type { ReactNode } from "react";

type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  children?: ReactNode;
  className?: string;
  contentClassName?: string;
  leadingGroupClassName?: string;
  titleWrapperClassName?: string;
  titleClassName?: string;
  subtitleClassName?: string;
};

export function PageHeader({
  title,
  subtitle,
  leading,
  trailing,
  children,
  className = "",
  contentClassName = "flex justify-between items-center px-4 py-4 w-full",
  leadingGroupClassName = "flex items-center gap-3",
  titleWrapperClassName = "",
  titleClassName = "text-2xl font-bold text-[#0058be]",
  subtitleClassName = "text-xs font-medium text-[#424754]",
}: PageHeaderProps) {
  return (
    <header className={className}>
      <div className={contentClassName}>
        <div className={leadingGroupClassName}>
          {leading}
          <div className={titleWrapperClassName}>
            <h1 className={titleClassName}>{title}</h1>
            {subtitle ? (
              <p className={subtitleClassName}>{subtitle}</p>
            ) : null}
          </div>
        </div>
        {trailing}
      </div>
      {children}
    </header>
  );
}
