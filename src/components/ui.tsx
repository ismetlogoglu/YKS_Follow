import type { ComponentProps, ReactNode } from "react";

export function cn(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/* -------------------------------------------------------------------------- */
/*  Button                                                                    */
/* -------------------------------------------------------------------------- */

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: "bg-primary text-on-primary hover:bg-primary-hover border-primary",
  secondary: "bg-accent text-on-accent hover:brightness-95 border-accent",
  outline: "bg-surface text-heading hover:bg-muted border-line-strong",
  ghost: "bg-transparent text-muted-ink hover:bg-muted border-transparent",
  danger: "bg-danger text-white hover:brightness-95 border-danger",
};

const BUTTON_SIZE: Record<ButtonSize, string> = {
  // min-h-11 = 44px: dokunma hedefi alt sınırı
  sm: "min-h-9 px-3 text-sm gap-1.5",
  md: "min-h-11 px-4 text-sm gap-2",
  lg: "min-h-12 px-5 text-base gap-2",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...props
}: ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return (
    <button
      className={cn(
        "inline-flex cursor-pointer items-center justify-center rounded-md border font-medium",
        "transition-colors duration-200",
        "disabled:pointer-events-none disabled:opacity-50",
        BUTTON_VARIANT[variant],
        BUTTON_SIZE[size],
        className,
      )}
      {...props}
    />
  );
}

/* -------------------------------------------------------------------------- */
/*  Form alanları                                                             */
/* -------------------------------------------------------------------------- */

const FIELD_BASE =
  "w-full min-h-11 rounded-md border border-line-strong bg-surface px-3 py-2 text-ink " +
  "placeholder:text-muted-ink/60 transition-colors duration-200 " +
  "hover:border-secondary focus:border-primary disabled:bg-muted disabled:opacity-70";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(FIELD_BASE, "tabular", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return <textarea className={cn(FIELD_BASE, "min-h-20 resize-y", className)} {...props} />;
}

export function Select({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(FIELD_BASE, "cursor-pointer pr-8", className)} {...props} />;
}

/**
 * Etiket her zaman görünür (placeholder etiket yerine geçmez) ve hata
 * mesajı alanın hemen altında durur.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}) {
  const hintId = hint && htmlFor ? `${htmlFor}-hint` : undefined;
  const errorId = error && htmlFor ? `${htmlFor}-error` : undefined;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-heading">
        {label}
        {required && (
          <span className="text-danger" aria-hidden="true">
            {" *"}
          </span>
        )}
      </label>
      {children}
      {hint && !error && (
        <p id={hintId} className="text-xs text-muted-ink">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Yüzeyler                                                                  */
/* -------------------------------------------------------------------------- */

export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("rounded-[10px] border border-line bg-surface", className)}
      {...props}
    />
  );
}

export function CardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-4 py-3 sm:px-5">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-heading">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-muted-ink">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Stat({
  label,
  value,
  unit,
  sub,
  tone = "default",
}: {
  label: string;
  value: string | number;
  unit?: string;
  sub?: string;
  tone?: "default" | "accent" | "success" | "danger";
}) {
  const toneClass = {
    default: "text-heading",
    accent: "text-accent",
    success: "text-success",
    danger: "text-danger",
  }[tone];

  return (
    <div className="rounded-[10px] border border-line bg-surface px-4 py-3">
      <p className="text-xs font-medium tracking-wide text-muted-ink uppercase">{label}</p>
      <p className={cn("tabular mt-1 text-2xl leading-tight font-semibold", toneClass)}>
        {value}
        {unit && <span className="ml-1 text-sm font-normal text-muted-ink">{unit}</span>}
      </p>
      {sub && <p className="mt-0.5 text-xs text-muted-ink">{sub}</p>}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "tyt" | "ayt" | "success" | "danger" | "warn";
}) {
  const tones = {
    neutral: "bg-muted text-muted-ink border-line-strong",
    tyt: "bg-muted text-primary border-line",
    ayt: "bg-warn-soft text-warn border-accent/40",
    success: "bg-success-soft text-success border-success/30",
    danger: "bg-danger-soft text-danger border-danger/30",
    warn: "bg-warn-soft text-warn border-warn/30",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 text-xs font-medium whitespace-nowrap",
        tones,
      )}
    >
      {children}
    </span>
  );
}

export function Alert({
  tone = "danger",
  title,
  children,
}: {
  tone?: "danger" | "success" | "warn";
  title?: string;
  children?: ReactNode;
}) {
  const tones = {
    danger: "border-danger/30 bg-danger-soft text-danger",
    success: "border-success/30 bg-success-soft text-success",
    warn: "border-warn/30 bg-warn-soft text-warn",
  }[tone];

  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-md border px-3 py-2.5 text-sm", tones)}
    >
      {title && <p className="font-semibold">{title}</p>}
      {children}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
      <p className="font-medium text-heading">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-ink">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Tablo — dar ekranlarda kendi içinde yatay kayar                           */
/* -------------------------------------------------------------------------- */

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({ className, ...props }: ComponentProps<"th">) {
  return (
    <th
      scope="col"
      className={cn(
        "border-b border-line px-3 py-2 text-left text-xs font-semibold tracking-wide text-muted-ink uppercase",
        className,
      )}
      {...props}
    />
  );
}

export function Td({ className, ...props }: ComponentProps<"td">) {
  return (
    <td className={cn("border-b border-line px-3 py-2 align-middle", className)} {...props} />
  );
}
