const { Pool } = require('pg');
require('dotenv').config();

// Initial connection to 'postgres' database to create our database if needed
const initialPool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'postgres' // Connect to default postgres database first
});

const createDbIfNotExists = async () => {
    try {
        // Check if database exists
        const dbCheckResult = await initialPool.query(
            "SELECT 1 FROM pg_database WHERE datname = $1",
            ['movies_db']
        );

        // Create database if it doesn't exist
        if (dbCheckResult.rows.length === 0) {
            await initialPool.query('CREATE DATABASE movies_db');
            console.log('Database created successfully');
        }
    } catch (err) {
        console.error('Error creating database:', err);
        throw err;
    } finally {
        await initialPool.end();
    }
};

// Pool for actual application use
const pool = new Pool({
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: 'movies_db'
});

// Function to test database connection
const testConnection = async () => {
    try {
        const client = await pool.connect();
        console.log('Database connection successful! ✅');
        client.release();
        return true;
    } catch (err) {
        console.error('Database connection failed! ❌');
        console.error('Error:', err.message);
        return false;
    }
};

// Function to initialize database tables
const initializeTables = async () => {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS genres (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL
            );

            CREATE TABLE IF NOT EXISTS movies (
                id SERIAL PRIMARY KEY,
                title VARCHAR(255) NOT NULL,
                description TEXT,
                release_date DATE,
                genre_id INTEGER REFERENCES genres(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(100) UNIQUE NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                movie_id INTEGER REFERENCES movies(id),
                user_id INTEGER REFERENCES users(id),
                rating INTEGER CHECK (rating >= 1 AND rating <= 5),
                comment TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS favourites (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id),
                movie_id INTEGER REFERENCES movies(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, movie_id)
            );
        `);
        console.log('Tables initialized successfully ✅');
    } catch (err) {
        console.error('Error initializing tables:', err);
        throw err;
    }
};

// Initialize database and tables
const initialize = async () => {
    await createDbIfNotExists();
    const isConnected = await testConnection();
    if (!isConnected) {
        throw new Error('Unable to establish database connection');
    }
    await initializeTables();
};

module.exports = { pool, initialize }; 