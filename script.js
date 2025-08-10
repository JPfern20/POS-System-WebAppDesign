// Get cart from localStorage or empty array
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

// Initialize cart display on page load
document.addEventListener("DOMContentLoaded", () => {
  renderCart();
});
