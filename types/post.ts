export type Post = {
  id?: string; // Firestore の doc.id を後で入れる用
  uid: string; // 投稿者の uid
  text: string; // コメント or 飲んだ内容
  photoURL?: string; // 写真（任意）
  location?: {
    lat: number;
    lng: number;
  }; // 位置情報（任意）
  createdAt: Date; // 投稿日時
};

