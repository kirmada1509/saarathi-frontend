"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Container, Stack, Text, NavLink, Clickable } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Moon, Sun, Menu, PlaneTakeoff } from "lucide-react";

const NAV_LINKS = [
  { href: "/app", label: "Plan Trip" },
  { href: "/app/travelers", label: "Travelers" },
  { href: "/app/compare", label: "Compare" },
  { href: "/app/how-it-works", label: "How It Works" },
];

export function TopNav() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    // Mount flag avoids a hydration mismatch on the theme icon (server never
    // knows the persisted theme). One-time sync with the browser environment.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <Stack className="sticky top-0 z-40 w-full border-b border-border-default bg-bg-base/85 backdrop-blur-md">
      <Container>
        <Stack direction="row" align="center" justify="between" className="h-16">
          <NavLink href="/" active={false} className="flex items-center gap-2 hover:text-text-primary">
            <PlaneTakeoff className="size-5 text-accent" />
            <Text variant="display" size="lg" weight="semibold" className="text-text-primary">
              Saarathi
            </Text>
          </NavLink>

          <Stack direction="row" align="center" gap={6} className="hidden lg:flex">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.href} href={link.href} active={isActive(link.href)}>
                {link.label}
              </NavLink>
            ))}
          </Stack>

          <Stack direction="row" align="center" gap={2}>
            {mounted && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Toggle theme"
                onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
              >
                {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </Button>
            )}

            <Clickable
              className="lg:hidden inline-flex items-center justify-center size-8 rounded-md hover:bg-bg-surface-raised text-text-primary"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="size-5" />
            </Clickable>
          </Stack>
        </Stack>
      </Container>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="bg-bg-surface border-l border-border-default text-text-primary p-6">
          <SheetHeader>
            <SheetTitle className="font-display text-accent">Saarathi</SheetTitle>
          </SheetHeader>
          <Stack gap={1} className="mt-4">
            {NAV_LINKS.map((link) => (
              <NavLink
                key={link.href}
                href={link.href}
                active={isActive(link.href)}
                onClick={() => setMobileOpen(false)}
                className="py-2.5 text-base"
              >
                {link.label}
              </NavLink>
            ))}
          </Stack>
        </SheetContent>
      </Sheet>
    </Stack>
  );
}
