const BASE_PATH = "./public";
Bun.serve({
  port: 4944,
  async fetch(req) {
    const url = new URL(req.url).pathname;
    const filepath = BASE_PATH + (url === "/" ? "/index.html" : url);
    const file = Bun.file(filepath);
    return new Response(file);
  },
  error() {
    return new Response(null, { status: 404 });
  },
});
