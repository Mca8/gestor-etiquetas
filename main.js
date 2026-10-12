import "./style.css";
import JSZip from "jszip";


/* =========================================================
   CONFIGURAÇÃO
========================================================= */

const STORAGE_KEY = "energy-products";


/* =========================================================
   ELEMENTOS HTML
========================================================= */

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
  copyPreviewButton: document.querySelector(
    "#copyPreviewButton"
  ),

  exportButton: document.querySelector("#exportButton"),
  clearButton: document.querySelector("#clearButton"),

  /* GERADOR DE IMAGENS */

  labelImageInput: document.querySelector(
    "#labelImageInput"
  ),

  imagePreviewContainer: document.querySelector(
    "#imagePreviewContainer"
  ),

  imagePreview: document.querySelector(
    "#imagePreview"
  ),

  selectedImageName: document.querySelector(
    "#selectedImageName"
  ),

  selectedProductsCount: document.querySelector(
    "#selectedProductsCount"
  ),

  imageProductsSelection: document.querySelector(
    "#imageProductsSelection"
  ),

  selectAllProductsButton: document.querySelector(
    "#selectAllProductsButton"
  ),

  clearProductSelectionButton: document.querySelector(
    "#clearProductSelectionButton"
  ),

  generateImagesButton: document.querySelector(
    "#generateImagesButton"
  ),

  toast: document.querySelector("#toast")
};


/* =========================================================
   DADOS
========================================================= */

let products = loadProducts();

const NEW_PRODUCTS_KEY = "new-product-ids";

let newProductIds = new Set(
  JSON.parse(localStorage.getItem(NEW_PRODUCTS_KEY) || "[]")
);

function saveNewProductIds() {
  localStorage.setItem(
    NEW_PRODUCTS_KEY,
    JSON.stringify([...newProductIds])
  );
}

let selectedLabelImage = null;
let selectedImagePreviewUrl = null;

let selectedProductIds = new Set();


/* =========================================================
   LOCAL STORAGE
========================================================= */

function loadProducts() {
  try {
    const storedProducts =
      localStorage.getItem(STORAGE_KEY);

    if (!storedProducts) {
      return [];
    }

    const parsedProducts =
      JSON.parse(storedProducts);

    return Array.isArray(parsedProducts)
      ? parsedProducts
      : [];
  } catch (error) {
    console.error(
      "Erro ao carregar produtos:",
      error
    );

    return [];
  }
}


function saveProducts() {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(products)
  );
}


/* =========================================================
   CRIAR PRODUTO
========================================================= */

function createProduct(id, energyClass) {
  const cleanId = String(id).trim();

  const cleanEnergyClass =
    String(energyClass)
      .trim()
      .toLowerCase();

  return {
    id_product:
      `card_equipment_id_${cleanId}`,

    class_e:
      `class-energ-${cleanEnergyClass}`,

    img_popup:
      `card_equipment_id_${cleanId}-popup`
  };
}


/* =========================================================
   OBTER ID SIMPLES
========================================================= */

function getRawId(product) {
  return product.id_product.replace(
    "card_equipment_id_",
    ""
  );
}


/* =========================================================
   OBTER CLASSE ENERGÉTICA SIMPLES
========================================================= */

function getEnergyClass(product) {
  return product.class_e.replace(
    "class-energ-",
    ""
  );
}


/* =========================================================
   ESCAPAR HTML
========================================================= */

function escapeHtml(value) {
  const div = document.createElement("div");

  div.textContent = String(value);

  return div.innerHTML;
}


/* =========================================================
   JSON FORMATADO
========================================================= */

function getPrettyJson() {
  if (products.length === 1) {
    return JSON.stringify(
      products[0],
      null,
      2
    );
  }

  return JSON.stringify(
    products,
    null,
    2
  );
}


/* =========================================================
   JSON MINIFICADO
========================================================= */

function getMinifiedJson() {
  if (products.length === 1) {
    return JSON.stringify(products[0]);
  }

  return JSON.stringify(products);
}


/* =========================================================
   RENDER PRINCIPAL
========================================================= */

function render() {
  renderProducts();
  renderJson();
  renderCount();
  renderImageProductsSelection();
  renderProductGroups();
}


/* =========================================================
   RENDER PRODUTOS
========================================================= */

function renderProducts() {
  elements.productsList.innerHTML = "";

  if (products.length === 0) {
    elements.emptyState.hidden = false;
    return;
  }

  elements.emptyState.hidden = true;
  const newProductsList = document.querySelector("#newProductsList");

  newProductsList.innerHTML = "";

  products.forEach((product, index) => {
    const id = getRawId(product);

    const energyClass =
      getEnergyClass(product);

    const popupId =
      `${id}-popup`;

    const card =
      document.createElement("article");

    card.className = "product-card";

    card.innerHTML = `
      <div class="product-card-header">

        <strong class="product-number">
          Produto ${index + 1}
        </strong>

        <span class="energy-badge energy-${energyClass}">
          ${escapeHtml(
            energyClass.toUpperCase()
          )}
        </span>

      </div>

      <dl>

        <div>
          <dt>ID PRODUCT</dt>
          <dd>${escapeHtml(id)}</dd>
        </div>

        <div>
          <dt>CLASS E</dt>
          <dd>${escapeHtml(
            energyClass.toUpperCase()
          )}</dd>
        </div>

        <div>
          <dt>IMG POPUP</dt>
          <dd>${escapeHtml(popupId)}</dd>
        </div>

      </dl>

      <div class="product-actions">

        <button
          type="button"
          class="button edit-product"
          data-id="${escapeHtml(id)}"
        >
          Editar
        </button>

        <button
          type="button"
          class="button button-danger delete-product"
          data-id="${escapeHtml(id)}"
        >
          Eliminar
        </button>

      </div>
    `;

    if (newProductIds.has(product.id_product)) {
      newProductsList.appendChild(card);
    } else {
      elements.productsList.appendChild(card);
    }
  });
}


/* =========================================================
   RENDER JSON
========================================================= */

function renderJson() {
  elements.jsonPreview.textContent =
    getPrettyJson();
}


/* =========================================================
   CONTADOR
========================================================= */

function renderCount() {
  const count = products.length;

  elements.productCount.textContent =
    `${count} ${
      count === 1
        ? "produto"
        : "produtos"
    }`;
}

function renderProductGroups() {
  const newProducts = products.filter(
    product => newProductIds.has(product.id_product)
  );

  const importedProducts = products.filter(
    product => !newProductIds.has(product.id_product)
  );

  document.querySelector("#newProductsCount").textContent =
    `${newProducts.length} novos`;

  document.querySelector("#importedProductsCount").textContent =
    `${importedProducts.length} produtos`;

  document.querySelector("#newProductsIds").innerHTML =
    newProducts.length
      ? newProducts.map(product => `
          <span class="new-id-badge">
            ${escapeHtml(getRawId(product))}
          </span>
        `).join("")
      : "<p>Ainda não adicionaste novos IDs.</p>";
}
/* =========================================================
   ADICIONAR PRODUTO
========================================================= */

function addProduct(event) {
  event.preventDefault();

  const id =
    elements.productId.value.trim();

  const energyClass =
    elements.energyClass.value;

  elements.formError.textContent = "";

  if (!id) {
    elements.formError.textContent =
      "Introduz um ID.";

    return;
  }

  if (!/^\d+$/.test(id)) {
    elements.formError.textContent =
      "O ID deve conter apenas números.";

    return;
  }

  const fullId =
    `card_equipment_id_${id}`;

  const alreadyExists =
    products.some(
      (product) =>
        product.id_product === fullId
    );

  if (alreadyExists) {
    elements.formError.textContent =
      "Este ID já existe.";

    return;
  }

  const newProduct = createProduct(id, energyClass);

  products.push(newProduct);

  newProductIds.add(newProduct.id_product);

  saveNewProductIds();

    saveProducts();
    render();

    elements.productForm.reset();

    /*
    * Classe energética volta sempre para A.
    */
    elements.energyClass.value = "a";

    elements.productId.focus();

    showToast("Produto adicionado.");
  }


/* =========================================================
   EDITAR PRODUTO
========================================================= */

function editProduct(id) {
  const fullId =
    `card_equipment_id_${id}`;

  const product =
    products.find(
      (item) =>
        item.id_product === fullId
    );

  if (!product) {
    return;
  }

  const currentClass =
    getEnergyClass(product);

  const newId = window.prompt(
    "ID do produto:",
    id
  );

  if (newId === null) {
    return;
  }

  const cleanId =
    newId.trim();

  if (!/^\d+$/.test(cleanId)) {
    window.alert(
      "O ID deve conter apenas números."
    );

    return;
  }

  const newClass = window.prompt(
    "Classe energética (A a G):",
    currentClass.toUpperCase()
  );

  if (newClass === null) {
    return;
  }

  const cleanClass =
    newClass
      .trim()
      .toLowerCase();

  if (!/^[a-g]$/.test(cleanClass)) {
    window.alert(
      "A classe energética deve estar entre A e G."
    );

    return;
  }

  const newFullId =
    `card_equipment_id_${cleanId}`;

  const duplicated =
    products.some(
      (item) =>
        item.id_product === newFullId &&
        item !== product
    );

  if (duplicated) {
    window.alert(
      "Já existe um produto com esse ID."
    );

    return;
  }

  const oldFullId =
    product.id_product;

  const updatedProduct =
    createProduct(
      cleanId,
      cleanClass
    );

  Object.assign(
    product,
    updatedProduct
  );

  // Atualizar o ID na lista de novos produtos
  if (newProductIds.delete(oldFullId)) {
    newProductIds.add(updatedProduct.id_product);
    saveNewProductIds();
  }
  /*
   * Se estava selecionado para geração
   * de imagem, atualiza a seleção.
   */

  if (
    selectedProductIds.has(oldFullId)
  ) {
    selectedProductIds.delete(
      oldFullId
    );

    selectedProductIds.add(
      updatedProduct.id_product
    );
  }

  saveProducts();
  render();

  showToast("Produto atualizado.");
}


/* =========================================================
   ELIMINAR PRODUTO
========================================================= */

function deleteProduct(id) {
  const confirmed =
    window.confirm(
      `Eliminar o produto ${id}?`
    );

  if (!confirmed) {
    return;
  }

  const fullId =
    `card_equipment_id_${id}`;

  newProductIds.delete(fullId);
  saveNewProductIds();

  products =
    products.filter(
      (product) =>
        product.id_product !== fullId
    );

  selectedProductIds.delete(
    fullId
  );

  saveProducts();
  render();

  showToast("Produto eliminado.");
}


/* =========================================================
   EVENTOS DOS CARTÕES
========================================================= */

function handleProductActions(event) {
  const editButton =
    event.target.closest(
      ".edit-product"
    );

  if (editButton) {
    editProduct(
      editButton.dataset.id
    );

    return;
  }

  const deleteButton =
    event.target.closest(
      ".delete-product"
    );

  if (deleteButton) {
    deleteProduct(
      deleteButton.dataset.id
    );
  }
}


/* =========================================================
   LIMPAR TODOS
========================================================= */

function clearProducts() {
  if (products.length === 0) {
    return;
  }

  const confirmed =
    window.confirm(
      "Queres eliminar todos os produtos?"
    );

  if (!confirmed) {
    return;
  }

  products = [];

  selectedProductIds.clear();

  // NOVO CÓDIGO
  newProductIds.clear();
  saveNewProductIds();

  saveProducts();
  render();

  showToast(
    "Todos os produtos foram eliminados."
  );
}


/* =========================================================
   COPIAR JSON MINIFICADO
========================================================= */

async function copyJson() {
  const json =
    getMinifiedJson();

  try {
    await navigator.clipboard.writeText(
      json
    );

    showToast(
      "JSON copiado."
    );
  } catch (error) {
    console.error(
      "Erro ao copiar JSON:",
      error
    );

    window.alert(
      "Não foi possível copiar o JSON."
    );
  }
}


/* =========================================================
   COPIAR PREVIEW FORMATADO
========================================================= */

async function copyPrettyJson() {
  const json =
    getPrettyJson();

  try {
    await navigator.clipboard.writeText(
      json
    );

    showToast(
      "JSON formatado copiado."
    );
  } catch (error) {
    console.error(
      "Erro ao copiar JSON:",
      error
    );
  }
}


/* =========================================================
   EXPORTAR COMO TXT

   O conteúdo continua a ser JSON válido.
   Apenas a extensão passa a ser .txt.
========================================================= */

function exportJson() {
  const json =
    getMinifiedJson();

  const blob = new Blob(
    [json],
    {
      type:
        "text/plain;charset=utf-8"
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  /*
   * ALTERA AQUI CASO QUEIRAS
   * OUTRO NOME PARA O FICHEIRO.
   */
  link.download =
    "data-labels.txt";

  document.body.appendChild(link);

  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showToast(
    "Ficheiro data-labels.txt exportado."
  );
}


/* =========================================================
   VALIDAÇÃO DO JSON IMPORTADO
========================================================= */

function isValidEnergyClass(value) {
  return /^class-energ-[a-g]$/i.test(
    String(value ?? "").trim()
  );
}


function extractIdFromProduct(value) {
  const match =
    String(value ?? "")
      .trim()
      .match(
        /^card_equipment_id_(\d+)$/
      );

  return match
    ? match[1]
    : null;
}


function validateImportedProduct(
  product
) {
  if (
    !product ||
    typeof product !== "object"
  ) {
    return {
      valid: false,
      message:
        "Existe um registo inválido."
    };
  }

  const id =
    extractIdFromProduct(
      product.id_product
    );

  if (!id) {
    return {
      valid: false,
      message:
        'O campo "id_product" deve ter o formato ' +
        '"card_equipment_id_62535".'
    };
  }

  if (
    !isValidEnergyClass(
      product.class_e
    )
  ) {
    return {
      valid: false,
      message:
        'O campo "class_e" deve estar entre ' +
        '"class-energ-a" e "class-energ-g".'
    };
  }

  const expectedPopup =
    `card_equipment_id_${id}-popup`;

  if (
    product.img_popup !==
    expectedPopup
  ) {
    return {
      valid: false,
      message:
        `O img_popup do produto ${id} deveria ser ` +
        `"${expectedPopup}".`
    };
  }

  const energyClass =
    product.class_e
      .replace(
        "class-energ-",
        ""
      )
      .toLowerCase();

  return {
    valid: true,

    product: createProduct(
      id,
      energyClass
    )
  };
}


/* =========================================================
   IMPORTAR JSON / TXT

   Permite importar tanto .json como .txt,
   desde que o conteúdo seja JSON válido.
========================================================= */

function importJsonFile(file) {
  if (!file) {
    return;
  }

  const reader =
    new FileReader();

  reader.onload = () => {
    try {
      const parsedJson =
        JSON.parse(
          reader.result
        );

      const importedProducts =
        Array.isArray(parsedJson)
          ? parsedJson
          : [parsedJson];

      if (
        importedProducts.length === 0
      ) {
        throw new Error(
          "O ficheiro não contém produtos."
        );
      }

      const validatedProducts = [];

      importedProducts.forEach(
        (product, index) => {
          const validation =
            validateImportedProduct(
              product
            );

          if (!validation.valid) {
            throw new Error(
              `Produto ${index + 1}: ` +
              validation.message
            );
          }

          validatedProducts.push(
            validation.product
          );
        }
      );

      const importedIds =
        validatedProducts.map(
          (product) =>
            product.id_product
        );

      if (
        new Set(importedIds).size !==
        importedIds.length
      ) {
        throw new Error(
          "O ficheiro contém IDs repetidos."
        );
      }

      const shouldReplace =
        window.confirm(
          "Queres substituir os produtos atuais " +
          "pelos produtos do ficheiro importado?"
        );

      if (!shouldReplace) {
        elements.fileInput.value =
          "";

        return;
      }

      products =
        validatedProducts;

        newProductIds.clear();
        saveNewProductIds();

      selectedProductIds.clear();

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
        "Não foi possível importar o ficheiro.\n\n" +
        error.message
      );
    } finally {
      elements.fileInput.value =
        "";
    }
  };

  reader.onerror = () => {
    window.alert(
      "Não foi possível ler o ficheiro."
    );

    elements.fileInput.value =
      "";
  };

  reader.readAsText(
    file,
    "UTF-8"
  );
}


/* =========================================================
   LISTA DE PRODUTOS PARA AS IMAGENS
========================================================= */

function renderImageProductsSelection() {
  if (
    !elements.imageProductsSelection
  ) {
    return;
  }

  elements.imageProductsSelection.innerHTML =
    "";

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
    const id =
      getRawId(product);

    const energyClass =
      getEnergyClass(product);

    const label =
      document.createElement(
        "label"
      );

    label.className =
      "product-selection-item";

    label.innerHTML = `
      <input
        type="checkbox"
        value="${escapeHtml(
          product.id_product
        )}"
        ${
          selectedProductIds.has(
            product.id_product
          )
            ? "checked"
            : ""
        }
      >

      <span class="product-selection-info">

        <strong>
          ID ${escapeHtml(id)}
        </strong>

        <small>
          Classe ${escapeHtml(
            energyClass.toUpperCase()
          )}
        </small>

      </span>
    `;

    elements.imageProductsSelection.appendChild(
      label
    );
  });

  updateImageGenerator();
}


/* =========================================================
   LIMPAR IDs QUE JÁ NÃO EXISTEM
========================================================= */

function removeInvalidProductSelections() {
  const existingIds =
    new Set(
      products.map(
        (product) =>
          product.id_product
      )
    );

  selectedProductIds.forEach(
    (idProduct) => {
      if (
        !existingIds.has(
          idProduct
        )
      ) {
        selectedProductIds.delete(
          idProduct
        );
      }
    }
  );
}


/* =========================================================
   CONTADOR DOS PRODUTOS SELECIONADOS
========================================================= */

function updateSelectedProductsCount() {
  if (
    !elements.selectedProductsCount
  ) {
    return;
  }

  const count =
    selectedProductIds.size;

  elements.selectedProductsCount.textContent =
    `${count} ${
      count === 1
        ? "produto selecionado"
        : "produtos selecionados"
    }`;
}


/* =========================================================
   ESTADO DO BOTÃO GERAR IMAGENS
========================================================= */

function updateImageGenerator() {
  updateSelectedProductsCount();

  if (
    !elements.generateImagesButton
  ) {
    return;
  }

  elements.generateImagesButton.disabled =
    !selectedLabelImage ||
    selectedProductIds.size === 0;
}


/* =========================================================
   SELECIONAR IMAGEM
========================================================= */

function handleLabelImageSelection(
  event
) {
  const file =
    event.target.files[0];

  selectedLabelImage = null;

  if (
    elements.imagePreviewContainer
  ) {
    elements.imagePreviewContainer.hidden =
      true;
  }

  if (
    selectedImagePreviewUrl
  ) {
    URL.revokeObjectURL(
      selectedImagePreviewUrl
    );

    selectedImagePreviewUrl =
      null;
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

  if (
    !allowedTypes.includes(
      file.type
    )
  ) {
    window.alert(
      "Seleciona uma imagem PNG, JPG, JPEG ou WEBP."
    );

    elements.labelImageInput.value =
      "";

    updateImageGenerator();

    return;
  }

  selectedLabelImage =
    file;

  selectedImagePreviewUrl =
    URL.createObjectURL(file);

  elements.imagePreview.src =
    selectedImagePreviewUrl;

  elements.selectedImageName.textContent =
    file.name;

  elements.imagePreviewContainer.hidden =
    false;

  updateImageGenerator();
}


/* =========================================================
   CHECKBOX DOS PRODUTOS
========================================================= */

function handleProductSelection(
  event
) {
  const checkbox =
    event.target.closest(
      'input[type="checkbox"]'
    );

  if (!checkbox) {
    return;
  }

  const idProduct =
    checkbox.value;

  if (checkbox.checked) {
    selectedProductIds.add(
      idProduct
    );
  } else {
    selectedProductIds.delete(
      idProduct
    );
  }

  updateImageGenerator();
}


/* =========================================================
   SELECIONAR TODOS
========================================================= */

function selectAllProducts() {
  products.forEach(
    (product) => {
      selectedProductIds.add(
        product.id_product
      );
    }
  );

  renderImageProductsSelection();
}


/* =========================================================
   LIMPAR SELEÇÃO
========================================================= */

function clearProductSelection() {
  selectedProductIds.clear();

  renderImageProductsSelection();
}


/* =========================================================
   EXTENSÃO DA IMAGEM
========================================================= */

function getFileExtension(
  filename
) {
  const lastDotIndex =
    filename.lastIndexOf(".");

  if (lastDotIndex === -1) {
    return "";
  }

  return filename
    .slice(lastDotIndex)
    .toLowerCase();
}


/* =========================================================
   GERAR ZIP DAS IMAGENS
========================================================= */

async function generateImagesZip() {
  if (!selectedLabelImage) {
    window.alert(
      "Seleciona primeiro uma imagem."
    );

    return;
  }

  if (
    selectedProductIds.size === 0
  ) {
    window.alert(
      "Seleciona pelo menos um produto."
    );

    return;
  }

  const selectedProducts =
    products.filter(
      (product) =>
        selectedProductIds.has(
          product.id_product
        )
    );

  if (
    selectedProducts.length === 0
  ) {
    window.alert(
      "Os produtos selecionados já não existem."
    );

    selectedProductIds.clear();

    renderImageProductsSelection();

    return;
  }

  try {
    elements.generateImagesButton.disabled =
      true;

    elements.generateImagesButton.textContent =
      "A gerar imagens...";

    const zip =
      new JSZip();

    const extension =
      getFileExtension(
        selectedLabelImage.name
      ) || ".png";

    const imageContent =
      await selectedLabelImage.arrayBuffer();

    selectedProducts.forEach(
      (product) => {
        const filename =
          `${product.img_popup}${extension}`;

        zip.file(
          filename,
          imageContent
        );
      }
    );

    const zipContent =
      await zip.generateAsync({
        type: "blob"
      });

    const downloadUrl =
      URL.createObjectURL(
        zipContent
      );

    const link =
      document.createElement(
        "a"
      );

    link.href =
      downloadUrl;

    link.download =
      "etiquetas-selecionadas.zip";

    document.body.appendChild(
      link
    );

    link.click();

    link.remove();

    URL.revokeObjectURL(
      downloadUrl
    );

    showToast(
      `${selectedProducts.length} ${
        selectedProducts.length === 1
          ? "imagem gerada"
          : "imagens geradas"
      }.`
    );
  } catch (error) {
    console.error(
      "Erro ao gerar imagens:",
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


/* =========================================================
   TOAST
========================================================= */

let toastTimeout = null;

function showToast(message) {
  if (!elements.toast) {
    return;
  }

  elements.toast.textContent =
    message;

  elements.toast.classList.add(
    "show"
  );

  clearTimeout(
    toastTimeout
  );

  toastTimeout =
    setTimeout(() => {
      elements.toast.classList.remove(
        "show"
      );
    }, 2500);
}


/* =========================================================
   EVENTOS
========================================================= */

elements.productForm?.addEventListener(
  "submit",
  addProduct
);


elements.productsList?.addEventListener(
  "click",
  handleProductActions
);

document.querySelector("#newProductsList")
  ?.addEventListener(
    "click",
    handleProductActions
  );


/* IMPORTAR */

elements.importButton?.addEventListener(
  "click",
  () => {
    elements.fileInput.click();
  }
);


elements.fileInput?.addEventListener(
  "change",
  () => {
    const selectedFile =
      elements.fileInput.files[0];

    importJsonFile(
      selectedFile
    );
  }
);


/* COPIAR */

elements.copyButton?.addEventListener(
  "click",
  copyJson
);


elements.copyPreviewButton?.addEventListener(
  "click",
  copyPrettyJson
);


/* EXPORTAR */

elements.exportButton?.addEventListener(
  "click",
  exportJson
);


/* LIMPAR */

elements.clearButton?.addEventListener(
  "click",
  clearProducts
);


/* IMAGEM */

elements.labelImageInput?.addEventListener(
  "change",
  handleLabelImageSelection
);


/* SELEÇÃO DE IDs */

elements.imageProductsSelection?.addEventListener(
  "change",
  handleProductSelection
);


elements.selectAllProductsButton?.addEventListener(
  "click",
  selectAllProducts
);


elements.clearProductSelectionButton?.addEventListener(
  "click",
  clearProductSelection
);


/* GERAR ZIP */

elements.generateImagesButton?.addEventListener(
  "click",
  generateImagesZip
);


/* =========================================================
   INICIAR
========================================================= */

render();
