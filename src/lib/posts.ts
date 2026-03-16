// /lib/posts.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getPostById(postId: string) {
  const ref = doc(db, "posts", postId);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  };
}

