"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useUIStore } from "@/lib/store";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  PlaneTakeoff,
  Route as RouteIcon,
  Users,
  GitCompareArrows,
  BookOpen,
  Home,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/app", label: "Compose a request", icon: PlaneTakeoff },
  { href: "/app/multi-city", label: "Multi-city composer", icon: RouteIcon },
  { href: "/app/travelers", label: "Traveler directory", icon: Users },
  { href: "/app/compare", label: "Compare travelers", icon: GitCompareArrows },
  { href: "/app/how-it-works", label: "How it works", icon: BookOpen },
];

export function CommandPalette() {
  const router = useRouter();
  const open = useUIStore((s) => s.commandPaletteOpen);
  const setOpen = useUIStore((s) => s.setCommandPaletteOpen);

  React.useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!open);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, setOpen]);

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="Jump to"
      description="Navigate Saarathi"
    >
      <CommandInput placeholder="Jump to a route..." />
      <CommandList>
        <CommandEmpty>No matches.</CommandEmpty>
        <CommandSeparator />
        <CommandGroup heading="Routes">
          {NAV_ITEMS.map((item) => (
            <CommandItem key={item.href} onSelect={() => go(item.href)}>
              <item.icon className="size-4" />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
