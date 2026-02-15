import { NextResponse } from "next/server";
import { searchFts } from "@/services/search";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const results = await searchFts(q);
  return NextResponse.json(results);
}
