import { TravelerProfileScreen } from "./TravelerProfileScreen";

export default async function TravelerProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <TravelerProfileScreen userId={userId} />;
}
