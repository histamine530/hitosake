export const dynamic = "force-dynamic";

import PostDetailClient from "@/components/PostDetailClient";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PostDetailClient id={id} />;
}
