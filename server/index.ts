import { createServer } from "http";
import { createApp } from "./app";

// Entry point: this module is the esbuild bundle target (`dist/index.js`) and
// is only executed when the server is run directly. The app itself lives in
// `./app` so it can be imported by tests without starting a listener.
const app = createApp();
const server = createServer(app);

const port = process.env.PORT || 3000;

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}/`);
});
