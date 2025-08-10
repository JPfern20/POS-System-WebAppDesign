const { Client } = require('pg');

exports.handler = async (event) => {
  if (!["GET", "POST"].includes(event.httpMethod)) {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    database: "PosSystem"
  });

  let result;
  const params = event.queryStringParameters || {};
  const action = params.action;

  try {
    await client.connect();

    // ==================== GET PRODUCTS ====================
    if (event.httpMethod === "GET" && action === "getProducts") {
      const res = await client.query("SELECT * FROM products ORDER BY product_id ASC");
      result = res.rows;
    }

    // ==================== GET USERS ====================
    else if (event.httpMethod === "GET" && action === "getUsers") {
      const res = await client.query("SELECT user_id, username, role, created_at FROM users ORDER BY user_id ASC");
      result = res.rows;
}

    // ==================== VIEW ORDERS ====================
    else if (event.httpMethod === "GET" && action === "viewOrders") {
      const res = await client.query(`
        SELECT o.*, s.status_name
        FROM orders o
        JOIN status s ON o.status_id = s.status_id
        ORDER BY o.order_date DESC
      `);
      result = res.rows;
    }

    // ==================== USER LOGIN ====================
    else if (event.httpMethod === "POST" && action === "login") {
      const body = JSON.parse(event.body || "{}");
      const { username, password } = body;

      if (!username || !password) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing username or password" }) };
      }

      const res = await client.query(
        "SELECT user_id, username, role FROM users WHERE username = $1 AND password = $2",
        [username, password]
      );

      if (res.rows.length > 0) {
        result = { success: true, ...res.rows[0] };
      } else {
        return { statusCode: 401, body: JSON.stringify({ success: false, error: "Invalid credentials" }) };
      }
    }

    // ==================== USER REGISTRATION ====================
    else if (event.httpMethod === "POST" && action === "registerUser") {
      const body = JSON.parse(event.body || "{}");
      const { username, password, role } = body;

      if (!username || !password) {
        return { statusCode: 400, body: JSON.stringify({ error: "Username and password are required" }) };
      }

      const userRole = role || "customer";

      const checkUser = await client.query(
        "SELECT user_id FROM users WHERE username = $1",
        [username]
      );
      if (checkUser.rows.length > 0) {
        return { statusCode: 400, body: JSON.stringify({ error: "Username already exists" }) };
      }

      await client.query(
        "INSERT INTO users (username, password, role) VALUES ($1, $2, $3)",
        [username, password, userRole]
      );

      result = { success: true, message: "User registered successfully" };
    }

    // ==================== PLACE ORDER ====================
    else if (event.httpMethod === "POST" && action === "placeOrder") {
      const body = JSON.parse(event.body || "{}");
      const { product_id, quantity, customer_name } = body;

      if (!product_id || !quantity || !customer_name) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing order fields" }) };
      }

      await client.query(
        "INSERT INTO orders (product_id, quantity, customer_name, status_id, order_date) VALUES ($1, $2, $3, 1, NOW())",
        [product_id, quantity, customer_name]
      );

      result = { success: true, message: "Order placed successfully" };
    }

    else {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid action" }) };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  } finally {
    await client.end();
  }

  
};
