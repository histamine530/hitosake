// /lib/users.ts
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function getUserById(uid: string) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);

  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...snap.data(),
  };
}

