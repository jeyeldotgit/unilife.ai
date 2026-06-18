import StudyKitDetailClient from "@/app/(app)/study/[id]/StudyKitDetailClient";

export default async function StudyKitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <StudyKitDetailClient id={id} />;
}
