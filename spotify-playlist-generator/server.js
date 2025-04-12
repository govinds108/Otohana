import { createServer } from "https";
import { parse } from "url";
import next from "next";
import { readFileSync } from "fs";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

// Load SSL certificate and key
const httpsOptions = {
  key: readFileSync("/Users/helebkat/bitcamp 2025/Otohana/spotify-playlist-generator/localhost-key.pem"),
  cert: readFileSync("/Users/helebkat/bitcamp 2025/Otohana/spotify-playlist-generator/localhost-cert.pem"),
};

app.prepare().then(() => {
  createServer(httpsOptions, (req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(3000, (err) => {
    if (err) throw err;
    console.log("> Ready on https://localhost:3000");
  });
});
