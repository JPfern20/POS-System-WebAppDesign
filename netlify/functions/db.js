const { Client } = require('pg');

exports.handler = async (event) => {
  if (!["GET", "POST"].includes(event.httpMethod)) {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  let result;

  try {
    await client.connect();

    const params = event.queryStringParameters || {};
    const action = params.action;

    // ==================== PRODUCTS ====================
    if (event.httpMethod === "GET" && action === "getProducts") {
      const res = await client.query("SELECT * FROM products ORDER BY product_id ASC");
      result = res.rows;
    }

    // ==================== VIEW ORDERS ====================
    else if (event.httpMethod === "GET" && action === "viewOrders") {
      const res = await client.query("SELECT * FROM orders ORDER BY order_date DESC");
      result = res.rows;
    }

    // ==================== USER LOGIN ====================
    else if (event.httpMethod === "GET" && action === "login") {
      const { username, password } = params;
      const res = await client.query(
        "SELECT * FROM users WHERE username=$1 AND password=$2",
        [username, password]
      );
      if (res.rows.length > 0) {
        result = { success: true, user: res.rows[0] };
      } else {
        return { statusCode: 401, body: JSON.stringify({ error: "Invalid credentials" }) };
      }
    }

    // ==================== ADMIN LOGIN ====================
    else if (event.httpMethod === "GET" && action === "adminLogin") {
      const { adminUsername, adminPassword } = params;
      const res = await client.query(
        "SELECT * FROM admins WHERE username=$1 AND password=$2",
        [adminUsername, adminPassword]
      );
      if (res.rows.length > 0) {
        result = { success: true, admin: res.rows[0] };
      } else {
        return { statusCode: 401, body: JSON.stringify({ error: "Invalid admin credentials" }) };
      }
    }

    // ==================== PLACE ORDER ====================
    else if (event.httpMethod === "POST" && action === "placeOrder") {
      const body = JSON.parse(event.body || "{}");
      const { product_id, quantity, customer_name } = body;

      if (!product_id || !quantity || !customer_name) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing order fields" }) };
      }

      await client.query(
        "INSERT INTO orders (product_id, quantity, customer_name, created_at) VALUES ($1, $2, $3, NOW())",
        [product_id, quantity, customer_name]
      );

      result = { success: true, message: "Order placed successfully" };
    }

    // ==================== INVALID ACTION ====================
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
