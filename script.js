document.addEventListener("DOMContentLoaded", function() {
    
    // "Order" button
    var myButton = document.getElementById("myButton");
    if (myButton) {
        myButton.addEventListener("click", function() {
            alert("You found me currently working on this!");
            // Here you can add functionality to place an order
        });
    }

    // "View Status" button
    var but1 = document.getElementById("but1");
    if (but1) {
        but1.addEventListener("click", async function() {
            try {
                const response = await fetch('/.netlify/functions/db.js?action=viewOrders');
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const orders = await response.json();
                console.log(orders); // You can display this data in your UI
                alert("Orders fetched successfully! Check the console for details.");
            } catch (error) {
                console.error('Error fetching orders:', error);
                alert("Failed to fetch orders.");
            }
        });
    }

    // Handle user login form submission
    var loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async function(event) {
            event.preventDefault(); // Prevent default form submission
            const username = document.getElementById("username").value;
            const password = document.getElementById("password").value;

            try {
                const response = await fetch(`/.netlify/functions/db.js?action=login&username=${username}&password=${password}`);
                const data = await response.json();
                if (response.ok) {
                    document.getElementById("message").innerText = data.message;
                    // Redirect or perform other actions on successful login
                    window.location.href = "dashboard.html"; // Redirect to a dashboard or home page
                } else {
                    document.getElementById("message").innerText = data.error;
                }
            } catch (error) {
                console.error('Error during login:', error);
                document.getElementById("message").innerText = "Login failed. Please try again.";
            }
        });
    }

    // "Admin Login" button
    var but2 = document.getElementById("but2");
    if (but2) {
        but2.addEventListener("click", function() {
            window.location.href = "nextpage.html";
        });
    }

    // "Back to Home" button
    var backButton = document.getElementById("backButton");
    if (backButton) {
        backButton.addEventListener("click", function() {
            window.location.href = "index.html";
        });
    }

    // "Go to Login Page" button
    var loginButton = document.getElementById("loginButton");
    if (loginButton) {
        loginButton.addEventListener("click", function() {
            window.location.href = "user.html";
        });
    }

    // Handle admin login form submission
    var adminLoginForm = document.getElementById("adminLoginForm");
    if (adminLoginForm) {
        adminLoginForm.addEventListener("submit", async function(event) {
            event.preventDefault(); // Prevent default form submission
            const adminUsername = document.getElementById("adminUsername").value;
            const adminPassword = document.getElementById("adminPassword").value;

            try {
                const response = await fetch(`/.netlify/functions/db.js?action=adminLogin&adminUsername=${adminUsername}&adminPassword=${adminPassword}`);
                const data = await response.json();
                if (response.ok) {
                    document.getElementById("message").innerText = data.message;
                    // Redirect or perform other actions on successful admin login
                    window.location.href = "adminDashboard.html"; // Redirect to an admin dashboard or home page
                } else {
                    document.getElementById("message").innerText = data.error;
                }
            } catch (error) {
                console.error('Error during admin login:', error);
                document.getElementById("message").innerText = "Admin login failed. Please try again.";
            }
        });
    }
});
