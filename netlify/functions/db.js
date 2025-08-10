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

    // ==================== GET CUSTOMERS ====================
    else if (event.httpMethod === "GET" && action === "getUsers") {
      const res = await client.query("SELECT user_id, username, role, created_at FROM users ORDER BY user_id ASC");
      result = res.rows;
    }

    // ==================== VIEW ORDERS ====================
    else if (event.httpMethod === "GET" && action === "viewOrders") {
      const res = await client.query(`
        SELECT o.order_id, o."customerID", u.username AS customer_name, oi.product_id, oi.quantity, s.status_name, o.order_date
        FROM orders o
        JOIN users u ON o."customerID" = u.user_id
        JOIN order_items oi ON o.order_id = oi.order_id
        JOIN status s ON o.status_id = s.status_id
        ORDER BY o.order_date DESC
      `);
      result = res.rows;
    }

    // ==================== USER LOGIN (including admins) ====================
    else if (event.httpMethod === "POST" && action === "login") {
      const body = JSON.parse(event.body || "{}");
      const { username, password } = body;

      if (!username || !password) {
        return { statusCode: 400, body: JSON.stringify({ error: "Missing username or password" }) };
      }

      // Try users table
      let res = await client.query(
        "SELECT user_id, username, role FROM users WHERE username = $1 AND password = $2",
        [username, password]
      );

      if (res.rows.length === 0) {
        // Try admins table
        res = await client.query(
          "SELECT admin_id as user_id, username, role FROM admins WHERE username = $1 AND password = $2",
          [username, password]
        );
      }

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
  const { product_id, quantity, customer_name, user_id } = body;

  if (!product_id || !quantity || !customer_name || !user_id) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing order fields" }) };
  }

  // 1. Get product price
  const productRes = await client.query(
    "SELECT price FROM products WHERE product_id = $1",
    [product_id]
  );
  if (productRes.rows.length === 0) {
    return { statusCode: 400, body: JSON.stringify({ error: "Product not found" }) };
  }
  const price = productRes.rows[0].price;

  // 2. Calculate total for the order (assuming single product order)
  const totalAmount = price * quantity;

  // 3. Insert into orders table
  const orderInsert = await client.query(
    `INSERT INTO orders (customerID, total_amount, status_id, order_date)
     VALUES ($1, $2, 1, NOW())
     RETURNING order_id`,
    [user_id, totalAmount]
  );
  const order_id = orderInsert.rows[0].order_id;

  // 4. Insert into order_items table
  await client.query(
    `INSERT INTO order_items (order_id, product_id, quantity, price)
     VALUES ($1, $2, $3, $4)`,
    [order_id, product_id, quantity, price]
  );

  result = { success: true, message: "Order placed successfully", order_id };
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
