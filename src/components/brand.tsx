import { cn } from "./ui";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
      focusable="false"
    >
      <rect width="32" height="32" rx="7" fill="currentColor" />
      <rect x="7" y="17" width="4" height="8" rx="1" fill="white" opacity="0.75" />
      <rect x="14" y="12" width="4" height="13" rx="1" fill="white" opacity="0.88" />
      <rect x="21" y="7" width="4" height="18" rx="1" fill="white" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <Logo className="h-7 w-7 text-primary" />
      <span className="text-lg font-semibold tracking-tight text-heading">YKS Takip</span>
    </span>
  );
}
