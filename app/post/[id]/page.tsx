// app/post/[id]/page.tsx
import PostDetailClient from "./PostDetailClient";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; // ← Next.js 16 の正しい params unwrap

  return <PostDetailClient id={id} />;
}
