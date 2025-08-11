// ==================== UTILITY: CART ====================

// Get cart from localStorage or return empty array
function getCart() {
  const cartJSON = localStorage.getItem("cart");
  return cartJSON ? JSON.parse(cartJSON) : [];
}

// Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// ==================== CART RENDERING ====================

// Render cart table UI
function renderCart() {
  const cart = getCart();
  const cartBody = document.getElementById("cartBody");
  const cartTotal = document.getElementById("cartTotal");
  if (!cartBody || !cartTotal) return;

  cartBody.innerHTML = ""; // Clear previous rows

  let total = 0;

  cart.forEach(item => {
    const price = Number(item.price) || 0;        // Safe number fallback
    const quantity = Number(item.quantity) || 0;  // Safe number fallback
    const subtotal = price * quantity;
    total += subtotal;

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${item.product_name || "Unknown"}</td>
      <td>${quantity}</td>
      <td>PHP${price.toFixed(2)}</td>
      <td>PHP${subtotal.toFixed(2)}</td>
      <td><button onclick="removeFromCart('${item.product_id}')">Remove</button></td>
    `;
    cartBody.appendChild(row);
  });

  cartTotal.textContent = `PHP${total.toFixed(2)}`;
}

// ==================== CART OPERATIONS ====================

// Add product to cart (asks for quantity)
function addToCart(productId, productName, price) {
  const qty = parseInt(prompt(`Enter quantity for ${productName}:`), 10);
  if (isNaN(qty) || qty <= 0) {
    alert("Invalid quantity. Please try again.");
    return;
  }

  let cart = getCart();
  const existingItem = cart.find(item => item.product_id === productId);

  if (existingItem) {
    existingItem.quantity += qty;
  } else {
    cart.push({ product_id: productId, product_name: productName, price, quantity: qty });
  }

  saveCart(cart);
  alert(`${qty} x ${productName} added to cart.`);
  renderCart();
}

// Remove product from cart by productId
function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.product_id !== productId);
  saveCart(cart);
  renderCart();
}

// ==================== CHECKOUT ====================

// Checkout cart and send order to server
async function checkout() {
  const user_id = localStorage.getItem("user_id");
  if (!user_id) {
    alert("Please login first.");
    window.location.href = "user.html?redirect=products.html";
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    alert("Cart is empty.");
    return;
  }

  try {
    const res = await fetch("/.netlify/functions/db?action=checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id, cart }),
    });

    const data = await res.json();

    if (data.success) {
      alert("Checkout successful! Your order ID: " + data.order_id);
      localStorage.removeItem("cart"); // Clear cart after checkout
      renderCart(); // Update cart display
    } else {
      alert("Failed to checkout: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Checkout error:", err);
    alert("Error connecting to server.");
  }
}

// ==================== PRODUCTS ====================

// Load products and render in product list table
function loadProducts() {
  fetch("/.netlify/functions/db?action=getProducts")
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("productList");
      if (!table) return;
      table.innerHTML = "";
      data.forEach(product => {
        table.innerHTML += `
          <tr>
            <td>${product.product_name}</td>
            <td>${product.description}</td>
            <td>$${Number(product.price).toFixed(2)}</td>
            <td>
              <button onclick="addToCart('${product.product_id}', '${product.product_name}', ${product.price})">
                Add to Cart
              </button>
            </td>
          </tr>
        `;
      });
    })
    .catch(err => console.error("Error loading products:", err));
}

// ==================== ORDERS (ADMIN) ====================

// Load all orders for admin view
function loadOrders() {
  fetch("/.netlify/functions/db?action=viewOrders")
    .then(res => res.json())
    .then(data => {
      const table = document.getElementById("orderList");
      if (!table) return;
      table.innerHTML = "";
      data.forEach(order => {
        table.innerHTML += `
          <tr>
            <td>${order.order_id}</td>
            <td>${order.customer_id} - ${order.customer_name}</td>
            <td>${order.product_id} (Qty: ${order.quantity})</td>
            <td>${order.status_name}</td>
            <td>${order.order_date}</td>
          </tr>
        `;
      });
    })
    .catch(err => console.error("Error loading orders:", err));
}

// ==================== PAGE LOAD LOGIC ====================

document.addEventListener("DOMContentLoaded", () => {
  const currentPage = window.location.pathname;
  const params = new URLSearchParams(window.location.search);

  renderCart();  // <-- FIX: call the function to render cart on page load

  // Products page → load products
  if (currentPage.includes("products.html")) {
    loadProducts();
  }

  // Orders page → load orders only if admin logged in or autoload param present
  if (currentPage.includes("orders.html")) {
    if (localStorage.getItem("adminLoggedIn") === "true" || params.get("autoload") === "true") {
      loadOrders();
    } else {
      alert("Please log in as admin to view orders.");
      window.location.href = "user.html";
    }
  }

  // Navigation buttons
  const backButton = document.getElementById("backButton");
  if (backButton) backButton.addEventListener("click", () => window.location.href = "index.html");

  const but1 = document.getElementById("but1");
  if (but1) but1.addEventListener("click", () => window.location.href = "products.html");

  const but2 = document.getElementById("but2");
  if (but2) but2.addEventListener("click", () => window.location.href = "nextpage.html");

  const loginButton = document.getElementById("loginButton");
  if (loginButton) {
    loginButton.addEventListener("click", () => {
      window.location.href = "user.html?redirect=" + encodeURIComponent(currentPage);
    });
  }
});

// ==================== USER LOGIN ====================

const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
      const res = await fetch("/.netlify/functions/db?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("username", username);
        localStorage.setItem("role", data.role || "customer");
        localStorage.setItem("user_id", data.user_id);
        document.getElementById("message").textContent = "Login successful!";
        if (data.role === "customer") {
          window.location.href = "products.html";
        } else {
          document.getElementById("message").textContent = "Invalid role for this form.";
        }
      } else {
        document.getElementById("message").textContent = data.message || "Login failed.";
      }
    } catch (err) {
      console.error(err);
      document.getElementById("message").textContent = "Error connecting to server.";
    }
  });
}

// ==================== ADMIN LOGIN ====================

const adminLoginForm = document.getElementById("adminLoginForm");
if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    try {
      const res = await fetch("/.netlify/functions/db?action=login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (data.success) {
        localStorage.setItem("username", username);
        localStorage.setItem("role", data.role || "admin");
        if (data.role === "admin") {
          localStorage.setItem("adminLoggedIn", "true");
          // Redirect to admin dashboard or orders page
          window.location.href = "admin-dashboard.html";
        } else {
          document.getElementById("message").textContent = "Invalid role for this form.";
        }
      } else {
        document.getElementById("message").textContent = data.message || "Login failed.";
      }
    } catch (err) {
      console.error(err);
      document.getElementById("message").textContent = "Error connecting to server.";
    }
  });
}

// ==================== USER REGISTRATION ====================

const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const roleElement = document.getElementById("role");
    const role = roleElement ? roleElement.value.trim() : "customer";

    if (!username || !password) {
      document.getElementById("message").textContent = "Username and password are required.";
      return;
    }

    try {
      const res = await fetch("/.netlify/functions/db?action=registerUser", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, role }),
      });

      const data = await res.json();

      if (data.success) {
        document.getElementById("message").textContent = "User registered successfully!";
      } else {
        document.getElementById("message").textContent = data.error || "Registration failed.";
      }
    } catch (err) {
      console.error(err);
      document.getElementById("message").textContent = "Error connecting to server.";
    }
  });
}
