import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { User } from "@/lib/types";

export function UserAvatar({
  user,
  className,
}: {
  user: Pick<User, "name" | "avatarUrl">;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-5", className)}>
      {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.name} />}
      <AvatarFallback className="text-[0.625rem] font-medium">
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
