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
      const res = await client.query(`
        SELECT o.order_id, o.product_id, o.quantity, o.customer_name, o.order_date,
               s.status_name
        FROM orders o
        JOIN status s ON o.status_id = s.status_id
        ORDER BY o.order_date DESC
      `);
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
      // Default na pending pag-order
      const finalStatusId = status_id || 1; // Default to 'Pending' status if not provided
      
      await client.query(
        "INSERT INTO orders (product_id, quantity, customer_name, status_id, order_date) VALUES ($1, $2, $3, $4, NOW())",
        [product_id, quantity, customer_name, finalStatusId]
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
