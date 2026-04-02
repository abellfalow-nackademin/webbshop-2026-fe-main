import { getProducts } from "../utils/productsApi.js";

// TEMP: Default products for rendering when backend is unavailable
const TEMP_PRODUCTS = [
  { name: "Organic Tomatoes", price: 4.99, image: null },
  { name: "Fresh Milk", price: 2.49, image: null },
  { name: "Whole Grain Bread", price: 3.99, image: null },
  { name: "Free Range Eggs", price: 5.49, image: null },
  { name: "Bananas", price: 1.29, image: null },
  { name: "Greek Yogurt", price: 3.79, image: null },
];

document.addEventListener("DOMContentLoaded", loadProducts);

async function loadProducts() {
  const productsContainer = document.getElementById("products");
  productsContainer.innerHTML = "<p>Loading products...</p>";

  try {
    const products = await getProducts();
    productsContainer.innerHTML = "";

    const toRender = products.length > 0 ? products : TEMP_PRODUCTS;
    if (products.length === 0) {
      productsContainer.dataset.temp = "true";
      const notice = document.createElement("p");
      notice.className = "temp-notice";
      notice.textContent = "Showing demo products (backend unavailable)";
      productsContainer.appendChild(notice);
    }

    toRender.forEach((product) => {
      const productCard = createProductCard(product);
      productsContainer.appendChild(productCard);
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    productsContainer.innerHTML = "";
    productsContainer.dataset.temp = "true";
    const notice = document.createElement("p");
    notice.className = "temp-notice";
    notice.textContent = "Showing demo products (backend unavailable)";
    productsContainer.appendChild(notice);
    TEMP_PRODUCTS.forEach((product) => {
      productsContainer.appendChild(createProductCard(product));
    });
  }
}

// Function to create an individual product card
function createProductCard(product) {
  const element = document.createElement("div");
  element.className = "product-card";

  const imageSection = product.image
    ? `<img class="product-card__image" src="${product.image}" alt="${product.name}" loading="lazy" />`
    : `<div class="product-card__image-placeholder">🥬</div>`;

  element.innerHTML = `
    ${imageSection}
    <div class="product-card__body">
      <div class=""product-card__info>
        <h3>${product.name}</h3>
        <p class="product-card__price">$${product.price.toFixed(2)}</p>
      </div>
      <div class="product-card__buttons">
        <button class="show-on-map-btn">Show On Map</button>
        <button class="send-request-btn">Send Request</button>
      </div>
    </div>
  `;

  element.querySelector(".show-on-map-btn").addEventListener("click", () => {
    alert(`Functionality not implemented yet`);
  });

  element.querySelector(".send-request-btn").addEventListener("click", () => {
    alert(`Functionality not implemented yet`);
  });

  return element;
}
