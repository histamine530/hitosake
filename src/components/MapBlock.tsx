"use client";

type MapBlockProps = {
  post: {
    lat?: number;
    lng?: number;
    [key: string]: any; // 他のプロパティも許容
  };
};

export default function MapBlock({ post }: MapBlockProps) {
  if (!post.lat || !post.lng) return null;

  return (
    <div className="flex flex-col gap-3">
      <h3 className="font-bold text-[#1A2A4F]">場所</h3>

      <iframe
        width="100%"
        height="250"
        className="rounded-xl"
        loading="lazy"
        src={`https://www.google.com/maps?q=${post.lat},${post.lng}&z=16&output=embed`}
      />

      <a
        href={`https://www.google.com/maps?q=${post.lat},${post.lng}`}
        target="_blank"
        className="text-blue-600 underline text-sm"
      >
        Google Maps で開く
      </a>
    </div>
  );
}
