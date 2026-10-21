import { createServer, type IncomingMessage } from "node:http";
import type { AddressInfo } from "node:net";

export interface MockRequest {
  method: string;
  path: string;
  query: URLSearchParams;
  headers: IncomingMessage["headers"];
  body: unknown;
}

export type MockHandler = (req: MockRequest) => { status: number; body: unknown };

/**
 * Server HTTP lokal buat test klien PUDU -- tidak pernah menyentuh
 * internet. Dipakai sebagai pengganti server PUDU sungguhan (tidak ada
 * akun/kredensial PUDU untuk dites, lihat laporan akhir).
 */
export async function startMockPuduServer(handler: MockHandler) {
  const server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      const rawBody = Buffer.concat(chunks).toString("utf8");
      let body: unknown = undefined;
      if (rawBody) {
        try {
          body = JSON.parse(rawBody);
        } catch {
          body = rawBody;
        }
      }
      const url = new URL(req.url ?? "/", "http://localhost");
      const result = handler({
        method: req.method ?? "GET",
        path: url.pathname,
        query: url.searchParams,
        headers: req.headers,
        body,
      });
      res.writeHead(result.status, { "Content-Type": "application/json" });
      res.end(JSON.stringify(result.body));
    });
  });

  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as AddressInfo;

  return {
    url: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  };
}
