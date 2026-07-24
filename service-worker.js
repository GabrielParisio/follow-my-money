const CACHE_NAME = "follow-my-money-v1";
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
self.addEventListener("fetch", (event) => {
  if(event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
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
  const dados = event.data ? event.data.json() : { title: "Follow My Money", body: "" };
  event.waitUntil(
    self.registration.showNotification(dados.title || "Follow My Money", {
      body: dados.body || "",
      icon: "icons/icon-192.png",
    })
  );
});
