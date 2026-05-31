import Script from "next/script"

const bootstrapScript = `
(function () {
  window.__deferredPwaInstall = window.__deferredPwaInstall || null;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    window.__deferredPwaInstall = e;
    window.dispatchEvent(new Event("pwa-install-ready"));
  });

  if (!("serviceWorker" in navigator)) return;

  var swUrl = "/serwist/sw.js";
  var scope = "/";

  function onRegistered() {
    window.dispatchEvent(new Event("pwa-sw-registered"));
  }

  navigator.serviceWorker
    .register(swUrl, { scope: scope, type: "module" })
    .then(onRegistered)
    .catch(function () {
      return navigator.serviceWorker.register(swUrl, { scope: scope }).then(onRegistered);
    })
    .catch(function () {});
})();
`

export function PwaBootstrapScript() {
  return (
    <Script id="pwa-bootstrap" strategy="beforeInteractive">
      {bootstrapScript}
    </Script>
  )
}
