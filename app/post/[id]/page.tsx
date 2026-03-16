export const dynamic = "force-dynamic";

import PostDetailClient from "@/components/PostDetailClient";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next.js 16 の params は Promise なので await が必要
  const { id } = await params;

  return <PostDetailClient id={id} />;
}
