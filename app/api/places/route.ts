import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { lat, lng } = await req.json();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // Nearby Search（近くの飲食店）
  const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=300&keyword=居酒屋&key=${apiKey}`;
  const nearbyRes = await fetch(nearbyUrl);
  const nearbyData = await nearbyRes.json();

  const results = [];

  for (const place of nearbyData.results.slice(0, 10)) {
    const placeId = place.place_id;

    // Details API（営業時間・写真複数・評価など）
    const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,photos,rating,user_ratings_total,types,opening_hours&key=${apiKey}`;
    const detailsRes = await fetch(detailsUrl);
    const details = await detailsRes.json();

    const d = details.result;

    results.push({
      name: d.name,
      placeId,
      address: d.formatted_address,
      rating: d.rating || null,
      reviews: d.user_ratings_total || 0,
      types: d.types || [],
      photos: (d.photos || []).slice(0, 3).map((p: any) => p.photo_reference),
      opening: d.opening_hours || null,
    });
  }

  return NextResponse.json(results);
}

