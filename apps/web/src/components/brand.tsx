import { cn } from "@/lib/utils";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "bg-foreground text-background flex size-6 items-center justify-center rounded-md",
        className,
      )}
      aria-hidden
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        className="size-3.5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 3.5 21 20H3l9-16.5Z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <BrandMark />
      <span className="text-base font-semibold tracking-tight">Pyramid</span>
    </div>
  );
}
