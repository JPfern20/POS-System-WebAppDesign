document.addEventListener("DOMContentLoaded", () => {
  // Check admin logged in
  if (localStorage.getItem("adminLoggedIn") !== "true") {
    alert("Please log in as admin.");
    window.location.href = "user.html";
    return;
  }

  // Buttons
  document.getElementById("logoutBtn").addEventListener("click", () => {
    localStorage.removeItem("adminLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("role");
    window.location.href = "user.html";
  });

  document.getElementById("backButton").addEventListener("click", () => {
    window.location.href = "index.html";
  });

  // Load all data
  loadOrders();
  loadProducts();
  loadUsers();
});

function loadOrders() {
  fetch("/.netlify/functions/db?action=viewOrders")
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#orderSummaryTable tbody");
      tbody.innerHTML = "";
      data.forEach(order => {
        tbody.innerHTML += `
          <tr>
            <td>${order.order_id}</td>
            <td>${order.customer_name}</td>
            <td>${order.products || "-"}</td>
            <td>${order.status_name}</td>
            <td>P${order.total_amount || "-"}</td>
            <td>${new Date(order.order_date).toLocaleString()}</td>
          </tr>
        `;
      });
    })
    .catch(console.error);
}

function loadProducts() {
  fetch("/.netlify/functions/db?action=getProducts")
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#productsTable tbody");
      tbody.innerHTML = "";
      data.forEach(product => {
        tbody.innerHTML += `
          <tr>
            <td>${product.product_name}</td>
            <td>${product.description}</td>
            <td>$${product.price}</td>
          </tr>
        `;
      });
    })
    .catch(console.error);
}

function loadUsers() {
  fetch("/.netlify/functions/db?action=getUsers")
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#usersTable tbody");
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
    .catch(console.error);
}
