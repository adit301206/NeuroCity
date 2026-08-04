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
        const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/neurocity';
        const conn = await mongoose.connect(uri);
        console.log(`[Database] MongoDB Grid Connected: ${conn.connection.host}`);
    } catch (error) {
        console.warn(`[Database Error] MongoDB Grid offline or connection failed: ${error.message}`);
        console.warn(`[Database Warning] Running in offline memory mode for endpoints.`);
    }
};

module.exports = connectDB;