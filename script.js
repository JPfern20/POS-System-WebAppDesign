// script.js

// Redirect based on login type
document.addEventListener("DOMContentLoaded", () => {
    const currentPage = window.location.pathname;

    if (currentPage.includes("products.html")) {
        loadProducts();
    }
    if (currentPage.includes("orders.html")) {
        loadOrders();
    }

    const backButton = document.getElementById("backButton");
    if (backButton) {
        backBtn.addEventListener("click", () => {
            window.location.href = "index.html";
        });
    }
    const but1 = document.getElementById("but1");
    if (but1) {
        but1.addEventListener("click", () => {
            window.location.href = "products.html";
        });
    }
    const but2 = document.getElementById("but2");
    if (but2) {
        but2.addEventListener("click", () => {
            window.location.href = "orders.html";
        });
    }
    const loginButton = document.getElementById("loginButton");
    if (loginButton) {
        loginButton.addEventListener("click", () => {
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            if (username === "admin" && password === "admin") {
                window.location.href = "orders.html";
            } else {
                alert("Invalid credentials. Please try again.");
            }
        });
    }
});

// Fetch and display products
function loadProducts() {
    fetch("/.netlify/functions/db?type=viewProducts")
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
                            <button onclick="placeOrder('${product.name}', ${product.price})">
                                Order
                            </button>
                        </td>
                    </tr>
                `;
            });
        })
        .catch(err => console.error("Error loading products:", err));
}

// Place an order
function placeOrder(productName, price) {
    const customerName = prompt("Enter your name:");
    const qty = parseInt(prompt("Enter quantity:"), 10);

    if (!customerName || isNaN(qty) || qty <= 0) {
        alert("Invalid input. Please try again.");
        return;
    }

    const orderData = {
        type: "placeOrder",
        customerName,
        product: productName,
        quantity: qty,
        total: qty * price
    };

    fetch("/.netlify/functions/db", {
        method: "POST",
        body: JSON.stringify(orderData)
    })
        .then(res => res.json())
        .then(res => {
            alert(res.message || "Order placed successfully!");
        })
        .catch(err => console.error("Error placing order:", err));
}

// Fetch and display orders (Admin)
function loadOrders() {
    fetch("/.netlify/functions/db?type=viewOrders")
        .then(res => res.json())
        .then(data => {
            const table = document.getElementById("orderList");
            table.innerHTML = "";
            data.forEach(order => {
                table.innerHTML += `
                    <tr>
                        <td>${order.order_id}</td>
                        <td>${order.customerID}</td>
                        <td>${order.product}</td>
                        <td>${order.status}</td>
                        <td>$${order.total_amount}</td>
                        <td>${order.order_date}</td>
                    </tr>
                `;
            });
        })
        .catch(err => console.error("Error loading orders:", err));
}
