import Script from "next/script"

const bootstrapScript = `
(function () {
  window.__deferredPwaInstall = window.__deferredPwaInstall || null;

  window.addEventListener("beforeinstallprompt", function (e) {
    e.preventDefault();
    window.__deferredPwaInstall = e;
    window.dispatchEvent(new Event("pwa-install-ready"));
  });

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/serwist/sw.js", { scope: "/", type: "module" })
      .catch(function () {});
  }
})();
`

export function PwaBootstrapScript() {
  return (
    <Script id="pwa-bootstrap" strategy="beforeInteractive">
      {bootstrapScript}
    </Script>
  )
}
