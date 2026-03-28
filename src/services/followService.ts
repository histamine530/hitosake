import { db } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, query, where, getDocs } from "firebase/firestore";

const followCol = collection(db, "follows");

export const followUser = async (followerId: string, followeeId: string) => {
  await addDoc(followCol, {
    followerId,
    followeeId,
    createdAt: new Date(),
  });
};

export const unfollowUser = async (followerId: string, followeeId: string) => {
  const q = query(
    followCol,
    where("followerId", "==", followerId),
    where("followeeId", "==", followeeId)
  );
  const snap = await getDocs(q);
  snap.forEach((doc) => deleteDoc(doc.ref));
};

export const isFollowing = async (followerId: string, followeeId: string) => {
  const q = query(
    followCol,
    where("followerId", "==", followerId),
    where("followeeId", "==", followeeId)
  );
  const snap = await getDocs(q);
  return !snap.empty;
};
