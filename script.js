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
        backButton.addEventListener("click", () => {
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
            window.location.href = "user.html";
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
// User Login
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    try {
        const res = await fetch("/.netlify/functions/db?type=login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success) {
            if (data.role === "user") {
                window.location.href = "products.html"; // user product page
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

// Admin Login
document.getElementById("adminLoginForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("adminUsername").value.trim();
    const password = document.getElementById("adminPassword").value.trim();

    try {
        const res = await fetch("/.netlify/functions/db?type=login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password })
        });

        const data = await res.json();

        if (data.success) {
            if (data.role === "admin") {
                window.location.href = "admin.html"; // admin page
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
// User Registration
document.getElementById("registerForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("regUsername").value.trim();
    const password = document.getElementById("regPassword").value.trim();
    const role = document.getElementById("role").value.trim() || "customer"; // default to customer

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



// Back Button
document.getElementById("backButton").addEventListener("click", () => {
    window.location.href = "index.html"; // home page
});

// Fetch and display products
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
                            <button onclick="placeOrder('${product.product_name}', '${product.product_name}', ${product.price})">
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
function placeOrder(productId, productName, price) {
    //Check if user is logged in local 
    if (!localStorage.getItem("username")) {
        window.location.href = "user.html?redirect=products.html";
        return;
    }
    const customerName = localStorage.getItem("username");
    const qty = parseInt(prompt('Enter quantity for ${productName}:'), 10);

    if (!customerName || isNaN(qty) || qty <= 0) {
        alert("Invalid input. Please try again.");
        return;
    }

    const orderData = {
        product_id: productId,
        quantity: qty,
        customer_name: customerName
    };

    fetch("/.netlify/functions/db", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
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
    fetch("/.netlify/functions/db?action=viewOrders")
        .then(res => res.json())
        .then(data => {
            const table = document.getElementById("orderList");
            table.innerHTML = "";
            data.forEach(order => {
                table.innerHTML += `
                    <tr>
                        <td>${order.order_id}</td>
                        <td>${order.customer_name}</td>
                        <td>${order.products}</td>
                        <td>${order.status}</td>
                        <td>P${order.total_amount}</td>
                        <td>${order.order_date}</td>
                    </tr>
                `;
            });
        })
        .catch(err => console.error("Error loading orders:", err));
}
