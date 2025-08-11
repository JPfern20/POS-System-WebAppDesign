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
  adminloadOrders();
  loadProducts();
  loadUsers();
});

function adminloadOrders() {
  fetch("/.netlify/functions/db?action=viewOrders")
    .then(res => res.json())
    .then(data => {
      const tbody = document.querySelector("#orderSummaryTable tbody");
      
      // Check if tbody is found
      if (!tbody) {
        console.error("Table body not found. Please check the HTML structure.");
        return; // Exit the function if tbody is not found
      }

      tbody.innerHTML = ""; // Clear existing rows

      // Group orders by order_id if necessary
      const groupedOrders = data.reduce((acc, order) => {
        if (!acc[order.order_id]) {
          acc[order.order_id] = {
            order_id: order.order_id,
            customer_name: order.customer_name,
            status_name: order.status_name,
            total_amount: order.total_amount,
            order_date: order.order_date,
            products: []
          };
        }
        acc[order.order_id].products.push({
          product_id: order.product_id,
          product_name: order.product_name,
          quantity: order.quantity
        });
        return acc;
      }, {});

      // Populate the table with grouped orders
      Object.values(groupedOrders).forEach(order => {
        const productDetails = order.products.map(p => `${p.product_name} (Qty: ${p.quantity})`).join(", ");
        tbody.innerHTML += `
          <tr>
            <td>${order.order_id}</td>
            <td>${order.customer_name}</td>
            <td>${productDetails || "-"}</td>
            <td>${order.status_name}</td>
            <td>PHP${order.total_amount || "-"}</td>
            <td>${new Date(order.order_date).toLocaleString()}</td>
          </tr>
        `;
      });
    })
    .catch(err => console.error("Error loading orders:", err));
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
