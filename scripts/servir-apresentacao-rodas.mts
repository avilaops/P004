import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

// Serve somente o artefato já compilado na CI, sem build ou testes locais.
const pasta = process.argv[2];
if (!pasta) throw new Error("Informe a pasta site do artefato rodas-comparacao da CI.");
const raiz = resolve(pasta);
if (!(await stat(resolve(raiz, "street.html"))).isFile()) throw new Error("Apresentação da CI ausente.");
const tipos: Record<string, string> = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml",
};
const servidor = createServer(async (req, res) => {
  try {
    const caminho = decodeURIComponent(new URL(req.url ?? "/", "http://localhost").pathname);
    const arquivo = resolve(raiz, `.${caminho === "/" ? "/street.html" : caminho}`);
    if (!arquivo.startsWith(raiz + sep)) { res.writeHead(404).end(); return; }
    const conteudo = await readFile(arquivo);
    res.writeHead(200, { "Content-Type": tipos[extname(arquivo)] ?? "application/octet-stream", "Cache-Control": "no-store" });
    res.end(conteudo);
  } catch { res.writeHead(404).end(); }
});
servidor.listen(3118, "127.0.0.1", () => console.log("Prévia da CI • http://localhost:3118/street.html"));
