import "./style.css";
import JSZip from "jszip";

const STORAGE_KEY = "gestor-produtos-json";

const elements = {
  productForm: document.querySelector("#productForm"),
  productId: document.querySelector("#productId"),
  energyClass: document.querySelector("#energyClass"),
  formError: document.querySelector("#formError"),

  productsList: document.querySelector("#productsList"),
  emptyState: document.querySelector("#emptyState"),
  productCount: document.querySelector("#productCount"),
  jsonPreview: document.querySelector("#jsonPreview"),

  importButton: document.querySelector("#importButton"),
  fileInput: document.querySelector("#fileInput"),
  copyButton: document.querySelector("#copyButton"),
  copyPreviewButton: document.querySelector("#copyPreviewButton"),
  exportButton: document.querySelector("#exportButton"),
  clearButton: document.querySelector("#clearButton"),
  labelImageInput: document.querySelector("#labelImageInput"),

  imagePreviewContainer: document.querySelector("#imagePreviewContainer"),
  imagePreview: document.querySelector("#imagePreview"),
  selectedImageName: document.querySelector("#selectedImageName"),
  selectedProductsCount: document.querySelector("#selectedProductsCount"),
  imageProductsSelection: document.querySelector("#imageProductsSelection"),
  selectAllProductsButton: document.querySelector("#selectAllProductsButton"),
  clearProductSelectionButton: document.querySelector("#clearProductSelectionButton"),
  generateImagesButton: document.querySelector("#generateImagesButton"),

  toast: document.querySelector("#toast")
};

let products = loadProducts();

let selectedLabelImage = null;
let selectedImagePreviewUrl = null;
let selectedProductIds = new Set();

function loadProducts() {
  try {
    const savedProducts = localStorage.getItem(STORAGE_KEY);

    if (!savedProducts) {
      return [];
    }

    const parsedProducts = JSON.parse(savedProducts);

    return Array.isArray(parsedProducts)
      ? parsedProducts
      : [];
  } catch (error) {
    console.error("Erro ao carregar produtos:", error);
    return [];
  }
}

function saveProducts() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(products)
  );
}

function normalizeId(value) {
  return String(value)
    .trim()
    .replace(/\D/g, "");
}

function createProduct(id, energyClass) {
  return {
    id_product: `card_equipment_id_${id}`,
    class_e: `class-energ-${energyClass.toLowerCase()}`,
    img_popup: `card_equipment_id_${id}-popup`
  };
}

function getRawId(product) {
  return product.id_product.replace(
    "card_equipment_id_",
    ""
  );
}

function getEnergyClass(product) {
  return product.class_e.replace(
    "class-energ-",
    ""
  );
}

function productExists(id) {
  const completeId = `card_equipment_id_${id}`;

  return products.some((product) => {
    return product.id_product === completeId;
  });
}

function handleSubmit(event) {
  event.preventDefault();

  elements.formError.textContent = "";

  const id = normalizeId(elements.productId.value);
  const energyClass = elements.energyClass.value;

  if (!id) {
    elements.formError.textContent =
      "Introduz um ID válido.";

    elements.productId.focus();
    return;
  }

  if (productExists(id)) {
    elements.formError.textContent =
      `O produto com o ID ${id} já existe.`;

    elements.productId.focus();
    return;
  }

  const product = createProduct(id, energyClass);

  products.push(product);

  saveProducts();
  render();

  elements.productForm.reset();

  // Define B novamente como opção predefinida.
  elements.energyClass.value = "a";

  elements.productId.focus();

  showToast("Produto adicionado.");
}

function render() {
  renderProducts();
  renderJson();
  renderCount();
  renderImageProductsSelection();
}

function renderProducts() {
  elements.productsList.innerHTML = "";

  elements.emptyState.hidden = products.length > 0;

  products.forEach((product, index) => {
    const id = getRawId(product);
    const energyClass = getEnergyClass(product);
    const popupId = `${id}-popup`;

    const article = document.createElement("article");
    article.className = "product-card";

    article.innerHTML = `
      <div class="product-information">
        <div class="product-heading">
          <span class="product-id">
            ID ${escapeHtml(id)}
          </span>

          <span class="energy-class energy-${energyClass}">
            ${energyClass.toUpperCase()}
          </span>
        </div>

        <dl>
          <div>
            <dt>ID Equipamento</dt>
            <dd>${escapeHtml(id)}</dd>
          </div>

          <div>
            <dt>Class Energética</dt>
            <dd>${escapeHtml(energyClass.toUpperCase())}</dd>
          </div>

          <div>
            <dt>Image Popup</dt>
            <dd>${escapeHtml(popupId)}</dd>
          </div>
        </dl>
      </div>

      <div class="product-actions">
        <button
          class="button"
          type="button"
          data-action="edit"
          data-index="${index}"
        >
          Editar
        </button>

        <button
          class="button button-danger"
          type="button"
          data-action="delete"
          data-index="${index}"
        >
          Eliminar
        </button>
      </div>
    `;

    elements.productsList.appendChild(article);
  });
}

function renderJson() {
  elements.jsonPreview.textContent =
    getPrettyJson();
}

function renderCount() {
  elements.productCount.textContent =
    `${products.length} ${
      products.length === 1
        ? "produto"
        : "produtos"
    }`;
}

function renderImageProductsSelection() {
  elements.imageProductsSelection.innerHTML = "";

  removeInvalidProductSelections();

  if (products.length === 0) {
    elements.imageProductsSelection.innerHTML = `
      <p class="selection-empty">
        Ainda não existem produtos.
      </p>
    `;

    updateImageGenerator();
    return;
  }

  products.forEach((product) => {
    const id = getRawId(product);

    const label = document.createElement("label");

    label.className = "product-selection-item";

    label.innerHTML = `
      <input
        type="checkbox"
        value="${escapeHtml(product.id_product)}"
        ${selectedProductIds.has(product.id_product) ? "checked" : ""}
      >

      <span class="product-selection-info">
        <strong>ID ${escapeHtml(id)}</strong>

        <small>
          ${escapeHtml(product.class_e)}
        </small>
      </span>
    `;

    elements.imageProductsSelection.appendChild(label);
  });

  updateImageGenerator();
}

function removeInvalidProductSelections() {
  const existingIds = new Set(
    products.map((product) => product.id_product)
  );

  selectedProductIds.forEach((idProduct) => {
    if (!existingIds.has(idProduct)) {
      selectedProductIds.delete(idProduct);
    }
  });
}

function updateSelectedProductsCount() {
  const count = selectedProductIds.size;

  elements.selectedProductsCount.textContent =
    `${count} ${
      count === 1
        ? "produto selecionado"
        : "produtos selecionados"
    }`;
}

function updateImageGenerator() {
  elements.generateImagesButton.disabled =
    !selectedLabelImage ||
    selectedProductIds.size === 0;

  updateSelectedProductsCount();
}

function handleLabelImageSelection(event) {
  const file = event.target.files[0];

  selectedLabelImage = null;
  elements.imagePreviewContainer.hidden = true;

  if (selectedImagePreviewUrl) {
    URL.revokeObjectURL(selectedImagePreviewUrl);
    selectedImagePreviewUrl = null;
  }

  if (!file) {
    updateImageGenerator();
    return;
  }

  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "image/webp"
  ];

  if (!allowedTypes.includes(file.type)) {
    window.alert(
      "Seleciona uma imagem PNG, JPG, JPEG ou WEBP."
    );

    elements.labelImageInput.value = "";
    updateImageGenerator();
    return;
  }

  selectedLabelImage = file;
  selectedImagePreviewUrl = URL.createObjectURL(file);

  elements.imagePreview.src =
    selectedImagePreviewUrl;

  elements.selectedImageName.textContent =
    file.name;

  elements.imagePreviewContainer.hidden = false;

  updateImageGenerator();
}

function handleProductSelection(event) {
  const checkbox = event.target.closest(
    'input[type="checkbox"]'
  );

  if (!checkbox) {
    return;
  }

  const idProduct = checkbox.value;

  if (checkbox.checked) {
    selectedProductIds.add(idProduct);
  } else {
    selectedProductIds.delete(idProduct);
  }

  updateImageGenerator();
}

function selectAllProducts() {
  products.forEach((product) => {
    selectedProductIds.add(product.id_product);
  });

  renderImageProductsSelection();
}

function clearProductSelection() {
  selectedProductIds.clear();

  renderImageProductsSelection();
}

function getFileExtension(filename) {
  const lastDotIndex = filename.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return filename
    .slice(lastDotIndex)
    .toLowerCase();
}

async function generateImagesZip() {
  if (!selectedLabelImage) {
    window.alert("Seleciona primeiro uma imagem.");
    return;
  }

  if (selectedProductIds.size === 0) {
    window.alert(
      "Seleciona pelo menos um produto."
    );

    return;
  }

  const selectedProducts = products.filter((product) => {
    return selectedProductIds.has(product.id_product);
  });

  if (selectedProducts.length === 0) {
    window.alert(
      "Os produtos selecionados já não existem."
    );

    selectedProductIds.clear();
    renderImageProductsSelection();
    return;
  }

  try {
    elements.generateImagesButton.disabled = true;

    elements.generateImagesButton.textContent =
      "A gerar imagens...";

    const zip = new JSZip();

    const extension =
      getFileExtension(selectedLabelImage.name) || ".png";

    const imageContent =
      await selectedLabelImage.arrayBuffer();

    selectedProducts.forEach((product) => {
      const filename =
        `${product.img_popup}${extension}`;

      zip.file(filename, imageContent);
    });

    const zipContent = await zip.generateAsync({
      type: "blob"
    });

    const downloadUrl =
      URL.createObjectURL(zipContent);

    const link = document.createElement("a");

    link.href = downloadUrl;
    link.download = "etiquetas-selecionadas.zip";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(downloadUrl);

    showToast(
      `${selectedProducts.length} ${
        selectedProducts.length === 1
          ? "imagem gerada"
          : "imagens geradas"
      }.`
    );
  } catch (error) {
    console.error(
      "Erro ao gerar as imagens:",
      error
    );

    window.alert(
      "Não foi possível gerar o ficheiro ZIP."
    );
  } finally {
    elements.generateImagesButton.textContent =
      "Gerar imagens selecionadas";

    updateImageGenerator();
  }
}

function editProduct(index) {
  const product = products[index];

  if (!product) {
    return;
  }

  const currentId = getRawId(product);
  const currentClass = getEnergyClass(product);

  const newIdInput = window.prompt(
    "ID do produto:",
    currentId
  );

  if (newIdInput === null) {
    return;
  }

  const newId = normalizeId(newIdInput);

  if (!newId) {
    window.alert("Introduz um ID válido.");
    return;
  }

  const duplicatedId = products.some(
    (existingProduct, existingIndex) => {
      return (
        existingIndex !== index &&
        existingProduct.id_product ===
          `card_equipment_id_${newId}`
      );
    }
  );

  if (duplicatedId) {
    window.alert(
      `O produto com o ID ${newId} já existe.`
    );

    return;
  }

  const newClassInput = window.prompt(
    "Classe energética entre A e G:",
    currentClass.toUpperCase()
  );

  if (newClassInput === null) {
    return;
  }

  const newClass = newClassInput
    .trim()
    .toLowerCase();

  const allowedClasses = [
    "a",
    "b",
    "c",
    "d",
    "e",
    "f",
    "g"
  ];

  if (!allowedClasses.includes(newClass)) {
    window.alert(
      "A classe energética deve estar entre A e G."
    );

    return;
  }

  products[index] = createProduct(
    newId,
    newClass
  );

  saveProducts();
  render();

  showToast("Produto atualizado.");
}

function deleteProduct(index) {
  const product = products[index];

  if (!product) {
    return;
  }

  const id = getRawId(product);

  const shouldDelete = window.confirm(
    `Eliminar o produto com o ID ${id}?`
  );

  if (!shouldDelete) {
    return;
  }

  products.splice(index, 1);

  saveProducts();
  render();

  showToast("Produto eliminado.");
}

function getPrettyJson() {
  if (products.length === 1) {
    return JSON.stringify(products[0], null, 2);
  }

  return JSON.stringify(products, null, 2);
}

function getMinifiedJson() {
  if (products.length === 1) {
    return JSON.stringify(products[0]);
  }

  return JSON.stringify(products);
}

async function copyJson() {
  const json = getMinifiedJson();

  try {
    await navigator.clipboard.writeText(json);
    showToast("JSON copiado.");
  } catch (error) {
    fallbackCopy(json);
  }
}

function fallbackCopy(content) {
  const textarea = document.createElement("textarea");

  textarea.value = content;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);

  textarea.select();
  document.execCommand("copy");

  textarea.remove();

  showToast("JSON copiado.");
}

function exportJson() {
  const json = getMinifiedJson();

  const blob = new Blob(
    [json],
    {
      type: "application/json;charset=utf-8"
    }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "dados.json";

  document.body.appendChild(link);

  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showToast("Ficheiro JSON exportado.");
}
function isValidEnergyClass(value) {
  return /^class-energ-[a-g]$/i.test(
    String(value ?? "").trim()
  );
}

function extractIdFromProduct(value) {
  const match = String(value ?? "")
    .trim()
    .match(/^card_equipment_id_(\d+)$/);

  return match ? match[1] : null;
}

function validateImportedProduct(product) {
  if (!product || typeof product !== "object") {
    return {
      valid: false,
      message: "Existe um registo inválido."
    };
  }

  const id = extractIdFromProduct(product.id_product);

  if (!id) {
    return {
      valid: false,
      message:
        'O campo "id_product" deve ter o formato ' +
        '"card_equipment_id_62535".'
    };
  }

  if (!isValidEnergyClass(product.class_e)) {
    return {
      valid: false,
      message:
        'O campo "class_e" deve estar entre ' +
        '"class-energ-a" e "class-energ-g".'
    };
  }

  const expectedPopup =
    `card_equipment_id_${id}-popup`;

  if (product.img_popup !== expectedPopup) {
    return {
      valid: false,
      message:
        `O img_popup do produto ${id} deveria ser ` +
        `"${expectedPopup}".`
    };
  }

  return {
    valid: true,
    product: createProduct(
      id,
      product.class_e
        .replace("class-energ-", "")
        .toLowerCase()
    )
  };
}
function importJsonFile(file) {
  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const parsedJson = JSON.parse(reader.result);

      const importedProducts = Array.isArray(parsedJson)
        ? parsedJson
        : [parsedJson];

      if (importedProducts.length === 0) {
        throw new Error(
          "O ficheiro JSON não contém produtos."
        );
      }

      const validatedProducts = [];

      importedProducts.forEach((product, index) => {
        const validation =
          validateImportedProduct(product);

        if (!validation.valid) {
          throw new Error(
            `Produto ${index + 1}: ${validation.message}`
          );
        }

        validatedProducts.push(validation.product);
      });

      const importedIds = validatedProducts.map(
        (product) => product.id_product
      );

      const hasRepeatedIds =
        new Set(importedIds).size !==
        importedIds.length;

      if (hasRepeatedIds) {
        throw new Error(
          "O ficheiro contém IDs repetidos."
        );
      }

      const shouldReplace = window.confirm(
        "Queres substituir os produtos atuais " +
        "pelos produtos do ficheiro importado?"
      );

      if (!shouldReplace) {
        return;
      }

      products = validatedProducts;

      saveProducts();
      render();

      showToast(
        `${products.length} ${
          products.length === 1
            ? "produto importado"
            : "produtos importados"
        }.`
      );
    } catch (error) {
      window.alert(
        `Não foi possível importar o JSON.\n\n${error.message}`
      );
    } finally {
      elements.fileInput.value = "";
    }
  };

  reader.onerror = () => {
    window.alert(
      "Não foi possível ler o ficheiro selecionado."
    );

    elements.fileInput.value = "";
  };

  reader.readAsText(file, "UTF-8");
}
function clearProducts() {
  if (products.length === 0) {
    return;
  }

  const shouldClear = window.confirm(
    "Eliminar todos os produtos?"
  );

  if (!shouldClear) {
    return;
  }

  products = [];

  saveProducts();
  render();

  showToast("Todos os produtos foram eliminados.");
}

function escapeHtml(value) {
  const element = document.createElement("div");

  element.textContent = String(value ?? "");

  return element.innerHTML;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("toast-visible");

  window.clearTimeout(showToast.timeout);

  showToast.timeout = window.setTimeout(() => {
    elements.toast.classList.remove(
      "toast-visible"
    );
  }, 2200);
}

elements.productForm.addEventListener(
  "submit",
  handleSubmit
);

elements.productsList.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest(
      "[data-action]"
    );

    if (!button) {
      return;
    }

    const index = Number(button.dataset.index);
    const action = button.dataset.action;

    if (action === "edit") {
      editProduct(index);
    }

    if (action === "delete") {
      deleteProduct(index);
    }
  }
);

elements.importButton.addEventListener(
  "click",
  () => {
    elements.fileInput.click();
  }
);

elements.fileInput.addEventListener(
  "change",
  () => {
    const selectedFile =
      elements.fileInput.files[0];

    importJsonFile(selectedFile);
  }
);

elements.copyButton.addEventListener(
  "click",
  copyJson
);

elements.copyPreviewButton.addEventListener(
  "click",
  copyJson
);

elements.exportButton.addEventListener(
  "click",
  exportJson
);

elements.clearButton.addEventListener(
  "click",
  clearProducts
);

elements.labelImageInput.addEventListener(
  "change",
  handleLabelImageSelection
);

elements.imageProductsSelection.addEventListener(
  "change",
  handleProductSelection
);

elements.selectAllProductsButton.addEventListener(
  "click",
  selectAllProducts
);

elements.clearProductSelectionButton.addEventListener(
  "click",
  clearProductSelection
);

elements.generateImagesButton.addEventListener(
  "click",
  generateImagesZip
);

render();