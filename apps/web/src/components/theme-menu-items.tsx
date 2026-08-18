"use client";

import { Check, Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { ACCENTS, ACCENT_LABEL, ACCENT_SWATCH, type Accent } from "@/lib/theme";

export function ThemeMenuItems() {
  const { theme, accent, setTheme, setAccent } = useTheme();

  return (
    <>
      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <Sun />
          Change Theme
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuLabel>Theme</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => setTheme("light")}>
              <Sun />
              Light
              {theme === "light" && <Check className="ml-auto" />}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setTheme("dark")}>
              <Moon />
              Dark
              {theme === "dark" && <Check className="ml-auto" />}
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>

      <DropdownMenuSub>
        <DropdownMenuSubTrigger>
          <AccentSwatch accent={accent} />
          Color Mode
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
          <DropdownMenuSubContent className="w-48">
            <DropdownMenuLabel>Color Mode</DropdownMenuLabel>
            {ACCENTS.map((option) => (
              <DropdownMenuItem key={option} onSelect={() => setAccent(option)}>
                <AccentSwatch accent={option} />
                {ACCENT_LABEL[option]}
                {accent === option && <Check className="ml-auto" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
    </>
  );
}

function AccentSwatch({ accent }: { accent: Accent }) {
  return (
    <span
      className="ring-border size-4 rounded-[4px] ring-1"
      style={{ backgroundColor: ACCENT_SWATCH[accent] }}
      aria-hidden
    />
  );
}
