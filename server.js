
const express = require('express');
const cors = require('cors');
const { pool, initialize } = require('./config/database');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// Initialize database and start server
const startServer = async () => {
    try {
        await initialize();
        
        // Your routes here
        app.get('/', (req, res) => {
            res.send('Movie API is running!');
        });

        // Start server only if database initialization is successful
        app.listen(port, () => {
            console.log(`Server running at http://localhost:${port} 🚀`);
        });
    } catch (err) {
        console.error('Failed to start server:', err);
        process.exit(1);
    }
};

// Genre endpoints
app.post('/genre', async (req, res) => {
    try {
        const { name } = req.body;
        const newGenre = await pool.query(
            'INSERT INTO genres (name) VALUES ($1) RETURNING *',
            [name]
        );
        res.json(newGenre.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Movie endpoints
// Create a new movie
app.post('/movie', async (req, res) => {
    try {
        const { title, description, release_date, genre_id } = req.body;
        const newMovie = await pool.query(
            'INSERT INTO movies (title, description, release_date, genre_id) VALUES ($1, $2, $3, $4) RETURNING *',
            [title, description, release_date, genre_id]
        );
        res.json(newMovie.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all movies
app.get('/movies', async (req, res) => {
    try {
        const movies = await pool.query(
            'SELECT m.*, g.name as genre_name FROM movies m LEFT JOIN genres g ON m.genre_id = g.id'
        );
        res.json(movies.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get a single movie by ID
app.get('/movie/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const movie = await pool.query(
            'SELECT m.*, g.name as genre_name FROM movies m LEFT JOIN genres g ON m.genre_id = g.id WHERE m.id = $1',
            [id]
        );
        if (movie.rows.length === 0) {
            return res.status(404).json({ message: "Movie not found" });
        }
        res.json(movie.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update a movie
app.put('/movie/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, release_date, genre_id } = req.body;
        const updatedMovie = await pool.query(
            'UPDATE movies SET title = $1, description = $2, release_date = $3, genre_id = $4 WHERE id = $5 RETURNING *',
            [title, description, release_date, genre_id, id]
        );
        
        if (updatedMovie.rows.length === 0) {
            return res.status(404).json({ message: "Movie not found" });
        }
        
        res.json(updatedMovie.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete a movie
app.delete('/movie/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM movies WHERE id = $1', [id]);
        res.json({ message: "Movie deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/movie', async (req, res) => {
    try {
        const { keyword } = req.query;
        const movies = await pool.query(
            'SELECT m.*, g.name as genre_name FROM movies m LEFT JOIN genres g ON m.genre_id = g.id WHERE m.title ILIKE $1',
            [`%${keyword}%`]
        );
        res.json(movies.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// User registration
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        // In a real application, you should hash the password before storing
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING *',
            [username, email, password]
        );
        res.json(newUser.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Review endpoints
app.post('/review', async (req, res) => {
    try {
        const { movie_id, user_id, rating, comment } = req.body;
        const newReview = await pool.query(
            'INSERT INTO reviews (movie_id, user_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
            [movie_id, user_id, rating, comment]
        );
        res.json(newReview.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Favourite endpoints
app.post('/favourite', async (req, res) => {
    try {
        const { user_id, movie_id } = req.body;
        const newFavourite = await pool.query(
            'INSERT INTO favourites (user_id, movie_id) VALUES ($1, $2) RETURNING *',
            [user_id, movie_id]
        );
        res.json(newFavourite.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/favourites', async (req, res) => {
    try {
        const { user_id } = req.query;
        const favourites = await pool.query(
            'SELECT m.* FROM movies m INNER JOIN favourites f ON m.id = f.movie_id WHERE f.user_id = $1',
            [user_id]
        );
        res.json(favourites.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// app.listen(port, () => {
//     console.log(`Server running at http://localhost:${port}`);
// }); 

startServer();