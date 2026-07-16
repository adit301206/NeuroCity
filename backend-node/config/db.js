const mongoose = require('mongoose');
const dns = require('dns');

// Set fallback public DNS servers to resolve MongoDB SRV records correctly, 
// as Node's default system resolver can fail in certain local/restricted network configurations.
try {
    dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (error) {
    console.warn(`[DNS Warning] Could not set custom DNS servers: ${error.message}`);
}

console.log("File started executing.")

const connectDB = async () => {
    console.log("DB connection starts")
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`[Database] MongoDB Grid Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`[Database Error] Initialization failure: ${error.message}`);
        process.exit(1); // Force terminate application loop on connection error
    }
};

module.exports = connectDB;