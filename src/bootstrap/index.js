const getCookie = (name) => {
  return document.cookie.split("; ").reduce((r, v) => {
    const parts = v.split("=");
    return parts[0] === name ? decodeURIComponent(parts[1]) : r;
  }, "");
};

const proxyFallback = () => {
  const element = document.createElement("div");
  element.innerText = "Service workers needs to be enabled.";
  document.body.appendChild(element);
  const name = "proxy_force_http";
  const existingCookie = getCookie(name);

  if (existingCookie.length > 0) {
    // do nothing?
  } else {
    // this should trigger new refresh that'll be handled by web proxy
    const expires = new Date(Date.now() + 864e5).toUTCString();
    document.cookie = `proxy_force_http=1;expires=${new Date(
      Date.now() + 864e5
    ).toUTCString()}`;
    window.location.reload();
  }
};

if ("serviceWorker" in navigator) {
  const serviceWorkerUrl = "/serviceWorker.js";

  navigator.serviceWorker.getRegistrations().finally(() => {
    navigator.serviceWorker
      .register(serviceWorkerUrl)
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => {
        console.log("Service Worker Ready");
        reg.update();
      })
      .then((reg) => {
        console.log("Reloading page");
        window.location.reload();
      })
      .catch((err) => {
        proxyFallback();
      });
  });
} else {
  proxyFallback();
}
