import pg from 'pg';
import dotenv from 'dotenv';


dotenv.config();

//Pool manages multiple database connections automatically.

const { Pool } = pg;

const pool = new Pool({
    //the full postgreSQL connection:
    connectionString: process.env.DATABASE_URL,
});



//query is a function with text(sql query string (e.g., "SELECT * FROM users WHERE id = $1"))
export const query = (text, params) => pool.query(text, params);

//Useful if you need  advanced operations, like transactions:
export const poolClient = pool;

// This makes pool the default export of the module.
// This file can be imported using  import pool from './db.js';
export default pool;

poolClient.connect((err, client, release) => {
    if (err) {
        console.error('Postgres pool connection error:', err.stack);
    } else {
        console.log('Postgres pool is connected');
        release(); // release client back to the pool
    }
});



poolClient.query('SELECT NOW()', (err, res) => {
    if (err) console.error('Query error:', err.stack);
    else console.log('DB time:', res.rows[0]);
});

