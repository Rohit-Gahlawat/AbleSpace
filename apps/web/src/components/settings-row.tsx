import { cn } from "@/lib/utils";

export function SettingsRow({
  label,
  description,
  children,
  className,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-start gap-2 px-4 py-4",
        "sm:flex-row sm:items-center sm:justify-between sm:gap-6",
        "border-b last:border-b-0",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <span className="text-muted-foreground text-xs">{description}</span>
        )}
      </div>
      <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto">
        {children}
      </div>
    </div>
  );
}

export function SettingsCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("bg-card overflow-hidden rounded-lg border", className)}>
      {children}
    </div>
  );
}

export function SettingsHeading({ children }: { children: React.ReactNode }) {
  return <h1 className="mb-4 text-xl font-semibold tracking-tight">{children}</h1>;
}

export function SettingsSection({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-8 mb-4 text-base font-semibold">{children}</h2>;
}
