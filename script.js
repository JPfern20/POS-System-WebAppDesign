// ==================== SCRIPT.JS ====================
// get cart from localStorage or empty array
function getCart() {
  const cartJSON = localStorage.getItem("cart");
  return cartJSON ? JSON.parse(cartJSON) : [];
}

// Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Render cart table UI
function renderCart() {
  const cart = getCart();
  const cartBody = document.getElementById("cartBody");
  const cartTotal = document.getElementById("cartTotal");
  if (!cartBody || !cartTotal) return;

  cartBody.innerHTML = ""; // clear previous rows

  let total = 0;

  cart.forEach(item => {
  const price = Number(item.price) || 0;        // safe number fallback
  const quantity = Number(item.quantity) || 0;  // safe number fallback
  const subtotal = price * quantity;

  total += subtotal;

  const row = document.createElement("tr");
  row.innerHTML = `
    <td>${item.product_name || "Unknown"}</td>
    <td>${quantity}</td>
    <td>$${price.toFixed(2)}</td>
    <td>$${subtotal.toFixed(2)}</td>
    <td><button onclick="removeFromCart('${item.product_id}')">Remove</button></td>
  `;
  cartBody.appendChild(row);
});

  cartTotal.textContent = `$${total.toFixed(2)}`;
}

// Add product to cart
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
      localStorage.removeItem("cart"); // clear cart after checkout
      renderCart(); // update cart display
      // Optionally redirect or update UI here
    } else {
      alert("Failed to checkout: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Checkout error:", err);
    alert("Error connecting to server.");
  }
}

// Page-specific logic on load
document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    renderCart
    // Products page → load products
    if (currentPage.includes("products.html")) {
        loadProducts();
    }

    // Orders page → load orders only if admin
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
                body: JSON.stringify({ username, password })
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
                body: JSON.stringify({ username, password })
            });

            const data = await res.json();

            if (data.success) {
                localStorage.setItem("username", username);
                // Use the role from server response to avoid forcing admin always
                localStorage.setItem("role", data.role || "admin");
                if (data.role === "admin") {
                    localStorage.setItem("adminLoggedIn", "true");
                    // Redirect to admin-dashboard.html instead of orders.html
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
                body: JSON.stringify({ username, password, role })
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
//==================== Render Cart ====================
function renderCart() {
  const cart = getCart();
  const cartBody = document.getElementById("cartBody");
  const cartTotal = document.getElementById("cartTotal");
  if (!cartBody || !cartTotal) return;

  cartBody.innerHTML = "";

  let total = 0;

  cart.forEach(item => {
    const subtotal = item.price * item.quantity;
    total += subtotal;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${item.product_name}</td>
      <td>${item.quantity}</td>
      <td>$${item.price.toFixed(2)}</td>
      <td>$${subtotal.toFixed(2)}</td>
      <td><button onclick="removeFromCart('${item.product_id}')">Remove</button></td>
    `;

    cartBody.appendChild(row);
  });

  cartTotal.textContent = `$${total.toFixed(2)}`;
}


// ==================== FETCH PRODUCTS ====================
function loadProducts() {
    fetch("/.netlify/functions/db?action=getProducts")
        .then(res => res.json())
        .then(data => {
            const table = document.getElementById("productList");
            table.innerHTML = "";
            data.forEach(product => {
                table.innerHTML += `
                    <tr>
                        <td>${product.product_name}</td>
                        <td>${product.description}</td>
                        <td>$${product.price}</td>
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

// ==================== PLACE ORDER ====================
function placeOrder(productId, productName, price) {
    const customerName = localStorage.getItem("username");
    const customerId = localStorage.getItem("user_id");

    if (!customerName || !customerId) {
        window.location.href = "user.html?redirect=products.html";
        return;
    }

    const qty = parseInt(prompt(`Enter quantity for ${productName}:`), 10);

    if (isNaN(qty) || qty <= 0) {
        alert("Invalid quantity. Please try again.");
        return;
    }

    const orderData = {
        product_id: productId,
        quantity: qty,
        customer_name: customerName,
        customer_id: customerId   // <-- send customer_id as well
    };

    fetch("/.netlify/functions/db?action=placeOrder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderData)
    })
    .then(res => res.json())
    .then(res => {
        alert(res.message || "Order placed successfully!");
    })
    .catch(err => console.error("Error placing order:", err));
}


// ==================== FETCH ORDERS (ADMIN) ====================
function loadOrders() {
    fetch("/.netlify/functions/db?action=viewOrders")
        .then(res => res.json())
        .then(data => {
            const table = document.getElementById("orderList");
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

// Load cart from localStorage or empty array
function getCart() {
  const cartJSON = localStorage.getItem("cart");
  return cartJSON ? JSON.parse(cartJSON) : [];
}

// Save cart to localStorage
function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Add product to cart
function addToCart(productId, productName, price) {
  let cart = getCart();

  // Ask quantity
  const qty = parseInt(prompt(`Enter quantity for ${productName}:`), 10);
  if (isNaN(qty) || qty <= 0) {
    alert("Invalid quantity. Please try again.");
    return;
  }

  // Check if product already in cart
  const existing = cart.find(item => item.product_id === productId);
  if (existing) {
    existing.quantity += qty; // Add quantity
  } else {
    cart.push({ product_id: productId, product_name: productName, price, quantity: qty });
  }
  saveCart(cart);
  alert(`${qty} x ${productName} added to cart.`);
}

// Show cart contents and checkout
function showCart() {
  let cart = getCart();
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  let message = "Your Cart:\n";
  cart.forEach((item, i) => {
    message += `${i + 1}. ${item.product_name} - Qty: ${item.quantity} - $${item.price}\n`;
  });
  message += "\nProceed to checkout?";

  if (confirm(message)) {
    checkoutCart();
  }
}

// Send the cart items to backend to create order and order_items
async function checkoutCart() {
  const customerId = localStorage.getItem("user_id");
  const customerName = localStorage.getItem("username");
  if (!customerId || !customerName) {
    alert("Please login first.");
    window.location.href = "user.html?redirect=products.html";
    return;
  }

  const cart = getCart();
  if (cart.length === 0) {
    alert("Your cart is empty.");
    return;
  }

  try {
    const res = await fetch("/.netlify/functions/db?action=checkoutCart", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_id: customerId,
        customer_name: customerName,
        items: cart
      })
    });

    const data = await res.json();
    if (data.success) {
      alert(`Order placed successfully! Order ID: ${data.order_id}`);
      localStorage.removeItem("cart");
    } else {
      alert("Failed to place order: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error(err);
    alert("Error connecting to server.");
  }
}

// Initialize or get cart from localStorage
function getCart() {
  return JSON.parse(localStorage.getItem("cart") || "[]");
}

function saveCart(cart) {
  localStorage.setItem("cart", JSON.stringify(cart));
}

// Add product to cart
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
    cart.push({ product_id: productId, quantity: qty });
  }
  saveCart(cart);
  alert(`${qty} x ${productName} added to cart.`);
  renderCart(); 
}

//================= Remove from Cart ====================
function removeFromCart(productId) {
  let cart = getCart();
  cart = cart.filter(item => item.product_id !== productId);
  saveCart(cart);
  renderCart();
}


// Checkout cart
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
      localStorage.removeItem("cart"); // clear cart after checkout
      // Optionally redirect or update UI
    } else {
      alert("Failed to checkout: " + (data.error || "Unknown error"));
    }
  } catch (err) {
    console.error("Checkout error:", err);
    alert("Error connecting to server.");
  }
}
