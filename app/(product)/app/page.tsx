import { Container, Stack, Text, GradientMotif, NavLink } from "@/components/ui/primitives";
import { RequestForm } from "@/components/composer/RequestForm";

export default function ComposerPage() {
  return (
    <Stack className="relative overflow-hidden">
      <GradientMotif variant="hero" />
      <Container className="max-w-2xl py-12 md:py-20">
        <Stack gap={8}>
          <Stack gap={2}>
            <Text variant="display" size="3xl" weight="semibold">
              Compose a request
            </Text>
            <Text variant="body" size="base" className="text-text-secondary">
              Pick a traveler, describe the trip, and Saarathi will commit to one verdict —
              not a ranked list — and show its work.
            </Text>
            <Text variant="subtext" size="xs">
              Planning more than one stop?{" "}
              <NavLink href="/app/multi-city" active={false} className="underline text-accent hover:text-accent-hover">
                Use the multi-city composer
              </NavLink>
              .
            </Text>
          </Stack>

          <RequestForm />
        </Stack>
      </Container>
    </Stack>
  );
}
