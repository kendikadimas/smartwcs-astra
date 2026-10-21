import { NextResponse } from "next/server";

// Format error konsisten lintas route, sesuai schema `Error` di
// docs/openapi-smart-wcs.yaml ({ code, message }).
export function apiError(status: number, code: string, message: string) {
  return NextResponse.json({ code, message }, { status });
}
