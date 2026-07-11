import { Container, Stack, Text, GradientMotif, NavLink } from "@/components/ui/primitives";
import { MultiCityForm } from "@/components/composer/MultiCityForm";

export default function MultiCityPage() {
  return (
    <Stack className="relative overflow-hidden">
      <GradientMotif variant="hero" />
      <Container className="max-w-2xl py-12 md:py-20">
        <Stack gap={8}>
          <Stack gap={2}>
            <Text variant="display" size="3xl" weight="semibold">
              Multi-city composer
            </Text>
            <Text variant="body" size="base" className="text-text-secondary">
              Chain cities in order — Saarathi scores each leg independently and lets
              you inspect the verdict per hop.
            </Text>
            <Text variant="subtext" size="xs">
              Flying to one place?{" "}
              <NavLink href="/app" active={false} className="underline text-accent hover:text-accent-hover">
                Use the single-destination composer
              </NavLink>
              .
            </Text>
          </Stack>

          <MultiCityForm />
        </Stack>
      </Container>
    </Stack>
  );
}
