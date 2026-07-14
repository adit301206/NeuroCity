const mongoose = require('mongoose');

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