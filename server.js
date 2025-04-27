const express = require('express');
const bcrypt = require('bcrypt');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Middleware
app.use(express.json());
app.use(express.static('public'));

// In-memory user storage (replace with database in production)
const users = [];

// Routes
app.post('/api/register', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if user exists
        if (users.find(user => user.email === email)) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = {
            email,
            password: hashedPassword,
            createdAt: new Date()
        };

        users.push(user);
        res.status(201).json({ message: 'Registration successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = users.find(user => user.email === email);
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Set session
        req.session.userId = user.email;
        res.json({ message: 'Login successful' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ message: 'Logout successful' });
});

app.get('/api/user', (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ message: 'Not authenticated' });
    }
    res.json({ email: req.session.userId });
});

// Serve static files
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
}); 