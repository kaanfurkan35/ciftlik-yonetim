import { NextResponse } from "next/server";

interface ApiResponseMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export function apiSuccess<T>(data: T, meta?: ApiResponseMeta) {
  return NextResponse.json({ success: true, data, meta });
}

export function apiError(error: string, status: number = 400) {
  return NextResponse.json({ success: false, error }, { status });
}

export function parseSearchParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
  const search = searchParams.get("search") || "";

  return { page, limit, sortBy, sortOrder, search, skip: (page - 1) * limit };
}
