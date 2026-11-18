(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const fileInput = $("fileInput"), dropZone = $("dropZone"), preview = $("sourcePreview");
  const emptyState = $("emptyState"), chooseButton = $("chooseButton"), clearButton = $("clearButton");
  const exportButton = $("exportButton"), statusMessage = $("statusMessage");
  let currentFile = null, currentUrl = null, currentImage = null;
  const announce = (message) => { statusMessage.textContent = message; };
  const openPicker = () => fileInput.click();

  function clearImage() {
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentUrl = null; currentFile = null; currentImage = null;
    preview.removeAttribute("src"); preview.classList.add("hidden"); emptyState.classList.remove("hidden");
    $("imageDimensions").textContent = "Nenhuma imagem"; $("fileName").textContent = "Nenhum arquivo carregado";
    clearButton.disabled = true; exportButton.disabled = true;
    $("exportNote").textContent = "Carregue uma imagem para habilitar a exportação.";
    announce("Imagem removida da área de trabalho."); fileInput.value = "";
  }

  function loadFile(file) {
    if (!file) return;
    const supported = ["image/jpeg", "image/png", "image/webp", "image/avif"];
    if (!supported.includes(file.type)) { announce("Formato inválido. Use JPG, PNG, WebP ou AVIF."); return; }
    if (file.size > 30 * 1024 * 1024) { announce("A imagem ultrapassa o limite inicial de 30 MB."); return; }
    if (currentUrl) URL.revokeObjectURL(currentUrl);
    currentFile = file; currentUrl = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      currentImage = image; preview.src = currentUrl; preview.classList.remove("hidden"); emptyState.classList.add("hidden");
      $("imageDimensions").textContent = image.naturalWidth + " × " + image.naturalHeight + " px";
      $("fileName").textContent = file.name; clearButton.disabled = false; exportButton.disabled = false;
      $("exportNote").textContent = "Exportação local em PNG. A remoção por IA será adicionada na próxima etapa.";
      announce("Imagem carregada localmente. Nenhum arquivo foi enviado.");
    };
    image.onerror = () => { URL.revokeObjectURL(currentUrl); currentUrl = null; currentFile = null; announce("Não foi possível abrir esta imagem."); };
    image.src = currentUrl;
  }

  chooseButton.addEventListener("click", openPicker);
  dropZone.addEventListener("click", (event) => { if (!event.target.closest("button") && !currentFile) openPicker(); });
  dropZone.addEventListener("keydown", (event) => {
    if ((event.key === "Enter" || event.key === " ") && !currentFile) { event.preventDefault(); openPicker(); }
  });
  fileInput.addEventListener("change", () => loadFile(fileInput.files?.[0]));
  clearButton.addEventListener("click", clearImage);
  ["dragenter", "dragover"].forEach((name) => dropZone.addEventListener(name, (event) => {
    event.preventDefault(); dropZone.classList.add("drag-over");
  }));
  ["dragleave", "drop"].forEach((name) => dropZone.addEventListener(name, (event) => {
    event.preventDefault(); dropZone.classList.remove("drag-over");
  }));
  dropZone.addEventListener("drop", (event) => { const file = event.dataTransfer?.files?.[0]; if (file) loadFile(file); });

  exportButton.addEventListener("click", () => {
    if (!currentImage || !currentFile) return;
    const canvas = document.createElement("canvas");
    canvas.width = currentImage.naturalWidth; canvas.height = currentImage.naturalHeight;
    const context = canvas.getContext("2d");
    if (!context) { announce("Seu navegador não disponibilizou o Canvas para exportação."); return; }
    context.drawImage(currentImage, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) { announce("Falha ao gerar o arquivo PNG."); return; }
      const url = URL.createObjectURL(blob), link = document.createElement("a");
      const baseName = currentFile.name.replace(/\.[^.]+$/, "") || "imagem";
      link.href = url; link.download = baseName + "-clearcut.png";
      document.body.appendChild(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
      announce("PNG exportado no seu dispositivo. Nesta versão, o fundo original é preservado.");
    }, "image/png");
  });
  window.addEventListener("beforeunload", () => { if (currentUrl) URL.revokeObjectURL(currentUrl); });
})();