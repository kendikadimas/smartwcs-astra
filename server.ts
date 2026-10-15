import { createServer } from "node:http";
import next from "next";
import { Server as SocketIOServer } from "socket.io";

const port = Number(process.env.PORT ?? 3000);
const dev = process.env.NODE_ENV !== "production";

const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer((req, res) => handle(req, res));

  const io = new SocketIOServer(httpServer, {
    path: "/ws",
  });

  // ponytail: single global namespace for now, split into per-domain
  // namespaces (task/equipment/alarm) once those modules emit real events.
  io.on("connection", (socket) => {
    socket.on("disconnect", () => {});
  });

  httpServer.listen(port, () => {
    console.log(`> Smart WCS ready on http://localhost:${port} (ws: /ws)`);
  });
});
