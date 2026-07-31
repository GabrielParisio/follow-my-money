const CACHE_NAME = "follow-my-money-v2";
const ARQUIVOS_ESSENCIAIS = [
  "./dashboard_live.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARQUIVOS_ESSENCIAIS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((nomes) =>
      Promise.all(nomes.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Estratégia: tenta a rede primeiro (pra sempre pegar dados atualizados da planilha quando online);
// se falhar (sem internet), cai pro que tiver em cache — assim o app pelo menos abre.
// "cache: no-store" é importante aqui: sem isso, o fetch() do navegador pode ele mesmo devolver uma
// resposta do cache HTTP comum (não do Cache Storage do service worker) mesmo quando achamos que
// estamos "buscando da rede" — o que fazia a pessoa continuar vendo a versão antiga mesmo online.
self.addEventListener("fetch", (event) => {
  if(event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request, { cache: "no-store" })
      .then((resposta) => {
        const copia = resposta.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copia));
        return resposta;
      })
      .catch(() => caches.match(event.request))
  );
});

// Fase 2 (ainda não construída): quando existir um servidor mandando push de verdade (notificação
// com o app fechado), ele chega aqui. Por enquanto ninguém envia nada pra esse endpoint — isso fica
// pronto esperando a peça de backend que ainda falta.
self.addEventListener("push", (event) => {
  const dados = event.data ? event.data.json() : { title: "Legacy", body: "" };
  event.waitUntil(
    self.registration.showNotification(dados.title || "Legacy", {
      body: dados.body || "",
      icon: "icons/icon-192.png",
    })
  );
});
