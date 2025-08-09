const { Pool } = require('pg');

// Configure PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, // Set in environment variables
    ssl: {
        rejectUnauthorized: false, // This is often necessary for cloud databases
    },
});

module.exports.handler = async (event, context) => {
    const params = event.queryStringParameters || {};
    const { action } = params;

    try {
        let result;
        switch (action) {
            case 'getProducts':
                result = await pool.query('SELECT * FROM products');
                return {
                    statusCode: 200,
                    body: JSON.stringify(result.rows),
                };
            case 'viewOrders':
                result = await pool.query('SELECT * FROM orders');
                return {
                    statusCode: 200,
                    body: JSON.stringify(result.rows),
                };
            case 'login':
                const { username, password } = params;
                if (!username || !password) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Username and password are required' }),
                    };
                }
                result = await pool.query('SELECT * FROM users WHERE username = $1 AND password = $2', [username, password]);
                if (result.rows.length > 0) {
                    return {
                        statusCode: 200,
                        body: JSON.stringify({ message: 'Login successful' }),
                    };
                } else {
                    return {
                        statusCode: 401,
                        body: JSON.stringify({ error: 'Invalid credentials' }),
                    };
                }

            case 'placeOrder':
                const { productId, quantity } = params;
                if (!productId || !quantity) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Product ID and quantity are required' }),
                    };
                }
                result = await pool.query('INSERT INTO orders (product_id, quantity) VALUES ($1, $2) RETURNING *', [productId, quantity]);
                return {
                    statusCode: 201,
                    body: JSON.stringify(result.rows[0]),
                };
            case 'adminLogin':
                // Admin login logic can be added here
                return {
                    statusCode: 200,
                    body: JSON.stringify({ message: 'Admin login functionality not implemented yet' }),
                };

            case 'adminLogin':
                const { adminUsername, adminPassword } = params;
                if (!adminUsername || !adminPassword) {
                    return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Admin username and password are required' }),
                 };
            }
                result = await pool.query('SELECT * FROM admins WHERE username = $1 AND password = $2', [adminUsername, adminPassword]);
                if (result.rows.length > 0) {
                     return {
                        statusCode: 200,
                        body: JSON.stringify({ message: 'Admin login successful' }),
                };
    } else {
        return {
            statusCode: 401,
            body: JSON.stringify({ error: 'Invalid admin credentials' }),
        };
    }
            default:
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Invalid action' }),
                };
        }
    } catch (error) {
        console.error('Database query error:', error); // Log the error for debugging
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }), // Generic error message
        };
    }
};
