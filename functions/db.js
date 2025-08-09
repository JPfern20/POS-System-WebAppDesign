const { Client } = require('pg');

exports.handler = async (event) => {
  // Only allow GET or POST
  if (event.httpMethod !== "GET" && event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const client = new Client({
    connectionString: process.env.NEON_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    const res = await client.query("SELECT NOW()");
    await client.end();
    return {
      statusCode: 200,
      body: JSON.stringify({ time: res.rows[0].now })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
};
