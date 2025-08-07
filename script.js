document.addEventListener("DOMContentLoaded", function() {
    // "Order" button
    var myButton = document.getElementById("myButton");
    if (myButton) {
        myButton.addEventListener("click", function() {
            alert("You found me currently working on this!");
        });
    }

    // "View Status"
    var but1 = document.getElementById("but1");
    if (but1) {
        but1.addEventListener("click", function() {
            alert("You found me currently working on this!");
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

    //"Submit Button"
    var submitButton = document.getElementById("submitButton");
    if (submitButton) {
        submitButton.addEventListener("click", function() {
            alert("You found me currently working on this!");
        });
    }

});
