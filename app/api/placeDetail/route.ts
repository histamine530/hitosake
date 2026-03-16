import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { placeId } = await req.json();
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,photos,rating,user_ratings_total,types,opening_hours&key=${apiKey}`;

  const res = await fetch(url);
  const data = await res.json();

  const d = data.result;

  return NextResponse.json({
    name: d.name,
    placeId,
    address: d.formatted_address,
    rating: d.rating || null,
    reviews: d.user_ratings_total || 0,
    types: d.types || [],
    photos: (d.photos || []).map((p: any) => p.photo_reference),
    opening: d.opening_hours || null,
  });
}

