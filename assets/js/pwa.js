if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((error) => {
      console.error("Erro ao registrar service worker:", error);
    });
  });
}

document.addEventListener("contextmenu", (event) => {
  event.preventDefault();
});

document.addEventListener("selectstart", (event) => {
  event.preventDefault();
});

document.addEventListener("dragstart", (event) => {
  event.preventDefault();
});

document.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  },
  { passive: false }
);
