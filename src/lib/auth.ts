// Belum ada Better Auth (ADR Section 9.1, diputuskan tapi belum
// diimplementasikan). Semua route API memanggil requireAuth() di awal
// handler supaya saat auth/RBAC benar-benar dipasang (Fase 6), hanya fungsi
// ini yang diganti isinya -- bukan setiap route satu-satu.
export interface AuthContext {
  userId: string | null;
}

// TODO(Fase 6): ganti isi fungsi ini saat Better Auth + RBAC dipasang
// (lihat docs/RBAC.md). Saat ini mengizinkan semua request.
export async function requireAuth(request: Request): Promise<AuthContext> {
  void request;
  return { userId: null };
}
