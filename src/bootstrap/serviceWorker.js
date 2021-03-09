const ic = require("@dfinity/agent");
// const nacl = require("tweetnacl");
const mime = require("mime-types");
const Buffer = require("buffer/").Buffer;

let actorInterface;

// class UserIdentity extends ic.SignIdentity {
//   constructor(keyPair) {
//     super();
//     this.keyPair = keyPair;
//   }

//   getPublicKey() {
//     return {
//       toDer: () =>
//         ic.derBlobFromBlob(ic.blobFromUint8Array(this.keyPair.publicKey)),
//     };
//   }

//   sign(blob) {
//     return ic.blobFromUint8Array(
//       nacl.sign.detached(blob, this.keyPair.secretKey)
//     );
//   }
// }

const getCanisterId = () => ":canisterId:";

const getActorInterface = () => {
  if (actorInterface) {
    return actorInterface;
  }

  // maybe we can pass key pair from browser tab?
  // const keyPair = nacl.sign.keyPair();

  // const identity = new UserIdentity(keyPair);

  const { HttpAgent } = ic;

  // const identity = new ic.AnonymousIdentity();

  const agent = new HttpAgent({
    // identity,
    host: "https://mercury.dfinity.network",
  });

  // agent.addTransform(ic.makeNonceTransform());

  // this works
  // agent.status().then((status) => {
  //   console.log("agent status", status);
  // });

  global.ic = {
    ...ic,
    agent,
  };

  const canisterId = getCanisterId();

  actorInterface = agent.makeActorFactory(({ IDL: e }) => {
    const t = e.Text,
      r = e.Vec(e.Nat8);
    return e.Service({
      retrieve: e.Func([t], [r], ["query"]),
      list: e.Func([], [e.Vec(t)], ["query"]),
      store: e.Func([t, r], [], []),
    });
  })({
    canisterId,
  });

  return actorInterface;
};

const dfinityFetch = async (pathname) => {
  try {
    const buff = await getActorInterface()
      .retrieve(pathname)
      .then((res) => Buffer.from(res));

    return new Response(buff, {
      headers: { "Content-Type": mime.lookup(pathname) },
    });
  } catch (e) {
    console.log("Error", e);

    return new Response(null, {
      status: 404,
      statusText: "Not Found",
    });
  }
};

self.addEventListener("install", (event) => {
  console.log("SW installing…");
  // return self.skipWaiting();
  // cache a cat SVG
  // event.waitUntil(
  //   caches.open("static-v1").then((cache) => cache.add("/cat.svg"))
  // );
});

self.addEventListener("activate", (event) => {
  // console.log("V1 now ready to handle fetches!");
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // external resources are fetched via standard web servers
  if (url.origin !== self.location.origin) {
    return event.respondWith(fetch(url.href));
  }

  let pathname = url.pathname;

  // if it's a directory, we're looking for index.html
  if (pathname.endsWith("/")) {
    pathname += "index.html";
  }

  // also we need to trim / from the beginning of pathname
  if (pathname.startsWith("/")) {
    pathname = pathname.substr(1);
  }

  // fetch proxy resources from a web server
  if (pathname === "serviceWorker.js") {
    return event.respondWith(fetch(pathname));
  }

  event.respondWith(
    caches.open("dynamic").then((cache) => {
      return cache.match(event.request).then((response) => {
        return (
          response ||
          dfinityFetch(pathname).then((response) => {
            cache.put(event.request, response.clone());
            return response;
          })
        );
      });
    })
  );
});
