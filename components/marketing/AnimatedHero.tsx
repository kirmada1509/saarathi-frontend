"use client";

import * as motion from "motion/react-client";
import { Stack, Text, Badge, NavLink } from "@/components/ui/primitives";
import { ArrowRight } from "lucide-react";

export function AnimatedHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    >
      <Stack gap={5} align="center">
        <Badge variant="warning">Expedia Group Campus Hackathon 2026</Badge>
        <Text variant="display" size="4xl" weight="semibold" className="leading-tight">
          The AI that takes a position — not just a ranked list.
        </Text>
        <Text variant="body" size="lg" className="text-text-secondary max-w-xl">
          Most flight search hands you fifty options and calls that &ldquo;helpful.&rdquo;
          Saarathi commits to one, defends it with evidence, and tells you exactly
          what would have to change for it to pick something else.
        </Text>
        <Stack direction="row" gap={3} className="flex-wrap justify-center pt-2">
          <NavLink
            href="/app"
            active={false}
            className="bg-accent text-text-on-accent hover:bg-accent-hover rounded-md px-5 py-2.5 font-medium flex items-center gap-1.5"
          >
            Start a request <ArrowRight className="size-4" />
          </NavLink>
          <NavLink
            href="/app/how-it-works"
            active={false}
            className="border border-border-default rounded-md px-5 py-2.5 hover:border-accent hover:text-accent"
          >
            See how it decides
          </NavLink>
        </Stack>
      </Stack>
    </motion.div>
  );
}
