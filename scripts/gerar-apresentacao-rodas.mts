import assert from "node:assert/strict";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { build } from "esbuild";

assert.equal(process.env.CI, "true", "Build de apresentação exclusivo do GitHub CI");
const destino = "artifacts/rodas-fiel/site";
await mkdir(destino, { recursive: true });
await build({ entryPoints: ["scripts/rodas-apresentacao.tsx"], outfile: `${destino}/app.js`, bundle: true, platform: "browser", format: "esm", jsx: "automatic", minify: true, define: { "process.env.NODE_ENV": '"production"' }, tsconfig: "tsconfig.json" });
await cp("public/media/templates-rodas", `${destino}/media/templates-rodas`, { recursive: true });
await cp("public/media/bereta/categories", `${destino}/media/bereta/categories`, { recursive: true });
await cp("public/marcas/automotivo", `${destino}/marcas/automotivo`, { recursive: true });
await cp("tests/fixtures/rodas-referencias", `${destino}/referencias`, { recursive: true });
const css = await readFile("src/components/home/rodas/rodas.css", "utf8");
const base = "*{box-sizing:border-box}body{margin:0}a{color:inherit}button,input{font:inherit}button{cursor:pointer}.rw-demo-notice{text-align:center;font:11px Arial;padding:12px;background:#eee;color:#333;margin:0}";
await writeFile(`${destino}/app.css`, base + css);
const cores = { street: ["#bc101a", "#ffffff"], racing: ["#f5c518", "#17181b"], night: ["#f5d328", "#17181b"], carbon: ["#bc1031", "#ffffff"] };
for (const [nome, [cor, texto]] of Object.entries(cores)) {
  await writeFile(`${destino}/${nome}.html`, `<!doctype html><html lang="pt-BR" data-modo="${nome === "night" ? "escuro" : "claro"}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Bereta Rodas • ${nome} • demonstração</title><link rel="stylesheet" href="/app.css"><style>:root{--primary:${cor};--primary-foreground:${texto}}</style></head><body data-layout="rodas-${nome}"><div id="apresentacao"></div><script type="module" src="/app.js"></script></body></html>`);
}
