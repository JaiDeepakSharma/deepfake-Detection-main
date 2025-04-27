// Database and Authentication Module
const auth = {
    db: null,

    // Initialize database
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open('DeepFakeAuth', 1);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('users')) {
                    db.createObjectStore('users', { keyPath: 'email' });
                }
            };
        });
    },

    // Register new user
    async register(email, password) {
        try {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['users'], 'readwrite');
                const store = transaction.objectStore('users');

                // Check if user already exists
                const checkRequest = store.get(email);
                checkRequest.onsuccess = () => {
                    if (checkRequest.result) {
                        resolve({ success: false, message: 'User already exists' });
                        return;
                    }

                    // Create new user
                    const user = {
                        email,
                        password: this.hashPassword(password), // In production, use proper password hashing
                        createdAt: new Date().toISOString()
                    };

                    const addRequest = store.add(user);
                    addRequest.onsuccess = () => {
                        resolve({ success: true, message: 'Registration successful' });
                    };
                    addRequest.onerror = () => {
                        reject(addRequest.error);
                    };
                };
            });
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Login user
    async login(email, password) {
        try {
            if (!this.db) await this.init();

            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction(['users'], 'readonly');
                const store = transaction.objectStore('users');
                const request = store.get(email);

                request.onsuccess = () => {
                    const user = request.result;
                    if (!user) {
                        resolve({ success: false, message: 'User not found' });
                        return;
                    }

                    if (this.hashPassword(password) === user.password) {
                        // Store login state
                        localStorage.setItem('isLoggedIn', 'true');
                        localStorage.setItem('userEmail', email);
                        resolve({ success: true, message: 'Login successful' });
                    } else {
                        resolve({ success: false, message: 'Invalid password' });
                    }
                };

                request.onerror = () => {
                    reject(request.error);
                };
            });
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Logout user
    async logout() {
        try {
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('userEmail');
            return { success: true, message: 'Logout successful' };
        } catch (error) {
            return { success: false, message: error.message };
        }
    },

    // Check if user is logged in
    async isLoggedIn() {
        return localStorage.getItem('isLoggedIn') === 'true';
    },

    // Get current user email
    async getCurrentUser() {
        return localStorage.getItem('userEmail');
    },

    // Simple password hashing (for demo purposes)
    // In production, use a proper password hashing library
    hashPassword(password) {
        return btoa(password); // Base64 encoding (NOT secure for production)
    }
};

// Initialize database when script loads
auth.init().catch(console.error); 