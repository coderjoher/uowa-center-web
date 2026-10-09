/* Starts the website, then asks it once to refresh its content from the CMS.
   The pages baked into the image were rendered while the CMS was unreachable
   (it isn't running during `docker build`), so they hold the bundled copy. */
import { spawn } from "node:child_process";

const port = process.env.PORT ?? "3000";
const secret = process.env.REVALIDATE_SECRET;
const server = spawn(process.execPath, ["server.js"], { stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => server.kill(signal));
server.on("exit", (code) => process.exit(code ?? 0));

if (secret) {
  for (let attempt = 0; attempt < 60; attempt++) {
    await new Promise((r) => setTimeout(r, 2000));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/api/revalidate`, {
        method: "POST",
        headers: { "x-revalidate-secret": secret },
      });
      if (res.ok) {
        console.log("[start] content refreshed from the CMS");
        break;
      }
    } catch {
      /* server not listening yet */
    }
  }
}
