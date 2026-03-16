"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

export default function EditProfilePage() {
  const [userName, setUserName] = useState("");
  const [userPhoto, setUserPhoto] = useState("");
  const [preview, setPreview] = useState("");
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    const u = auth.currentUser;
    if (!u) return;

    const load = async () => {
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const data = snap.data();
        setUserName(data.userName || "");
        setUserPhoto(data.userPhoto || "");
        setPreview(data.userPhoto || "");
      }
      setLoading(false);
    };

    load();
  }, []);

  const handleFile = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const u = auth.currentUser;
    if (!u) return;

    const storageRef = ref(storage, `userIcons/${u.uid}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);

    setUserPhoto(url);
  };

  const save = async () => {
    const u = auth.currentUser;
    if (!u) return;

    await updateDoc(doc(db, "users", u.uid), {
      userName,
      userPhoto,
    });

    router.push("/profile");
  };

  if (loading)
    return <p className="p-5 text-[#1A2A4F] opacity-80">読み込み中...</p>;

  return (
    <div className="min-h-screen bg-[#FAF7F2] p-6">
      <h2 className="text-xl font-bold text-[#1A2A4F] opacity-90 mb-6">
        プロフィール編集
      </h2>

      {/* アイコンプレビュー */}
      <div className="flex justify-center mb-6">
        <img
          src={preview || "/default.png"}
          className="w-24 h-24 rounded-full object-cover"
        />
      </div>

      {/* 画像アップロード */}
      <label className="block mb-2 text-[#1A2A4F] font-semibold opacity-90">
        アイコン画像
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFile}
        className="mb-6"
      />

      {/* ユーザ名 */}
      <label className="block mb-2 text-[#1A2A4F] font-semibold opacity-90">
        ユーザ名
      </label>
      <input
        type="text"
        value={userName}
        onChange={(e) => setUserName(e.target.value)}
        className="w-full p-3 rounded-lg border border-gray-300 bg-white mb-6 text-[#1A2A4F]"
      />

      <button
        onClick={save}
        className="w-full py-3 bg-[#1A2A4F] text-white rounded-lg font-semibold hover:bg-[#16213d]"
      >
        保存する
      </button>
    </div>
  );
}
