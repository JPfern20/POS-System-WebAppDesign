document.addEventListener("DOMContentLoaded", () => {
  // Check admin logged in
  if (localStorage.getItem("adminLoggedIn") !== "true") {
    alert("Please log in as admin.");
    window.location.href = "user.html";
    return;
  }

  // Setup buttons
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("adminLoggedIn");
      localStorage.removeItem("username");
      localStorage.removeItem("role");
      window.location.href = "user.html";
    });
  }

  const backButton = document.getElementById("backButton");
  if (backButton) {
    backButton.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  }

  // Load all data tables
  loadOrders();
  loadProducts();
  loadUsers();
});

function loadOrders() {
  fetch("/.netlify/functions/db?action=viewOrders")
    .then(res => res.json())
    .then(data => {
      const groupedOrders = {};

      data.forEach(row => {
        if (!groupedOrders[row.order_id]) {
          groupedOrders[row.order_id] = {
            order_id: row.order_id,
            customer_name: row.customer_name,
            status_name: row.status_name,
            total_amount: row.total_amount,
            order_date: row.order_date,
            products: []
          };
        }
        groupedOrders[row.order_id].products.push({
          product_id: row.product_id,
          quantity: row.quantity
        });
      });

      const tbody = document.querySelector("#orderSummaryTable tbody");
      if (!tbody) return;
      tbody.innerHTML = "";

      Object.values(groupedOrders).forEach(order => {
        const productListHTML = `
          <ul style="padding-left: 15px; margin: 0;">
            ${order.products
              .map(p => `<li>Product ID: ${p.product_id} (Qty: ${p.quantity})</li>`)
              .join("")}
          </ul>
        `;

        tbody.innerHTML += `
          <tr>
            <td>${order.order_id}</td>
            <td>${order.customer_name}</td>
            <td>${productListHTML}</td>
            <td>${order.status_name}</td>
            <td>$${order.total_amount.toFixed(2)}</td>
            <td>${new Date(order.order_date).toLocaleString()}</td>
          </tr>
        `;
      });
    })
    .catch(err => {
      console.error("Error loading orders:", err);
    });
}

function loadProducts() {
  fetch("/.netlify/functions/db?action=getProducts")
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#productsTable tbody");
      if (!tbody) return;
      tbody.innerHTML = "";

      data.forEach(product => {
        tbody.innerHTML += `
          <tr>
            <td>${product.product_name}</td>
            <td>${product.description}</td>
            <td>$${product.price.toFixed(2)}</td>
          </tr>
        `;
      });
    })
    .catch(err => {
      console.error("Error loading products:", err);
    });
}

function loadUsers() {
  fetch("/.netlify/functions/db?action=getUsers")
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#usersTable tbody");
      if (!tbody) return;
      tbody.innerHTML = "";

      data.forEach(user => {
        tbody.innerHTML += `
          <tr>
            <td>${user.user_id}</td>
            <td>${user.username}</td>
            <td>${user.role}</td>
            <td>${new Date(user.created_at).toLocaleString()}</td>
          </tr>
        `;
      });
    })
    .catch(err => {
      console.error("Error loading users:", err);
    });
}
