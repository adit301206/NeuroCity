require('dotenv').config();
const connectDB = require('./config/db');
const User = require('./models/User');
const mongoose = require('mongoose');

const seedAdmin = async () => {
    try {
        // Connect to MongoDB using the connection method defined in our config
        await connectDB();

        const adminEmail = 'admin@neurocity.gov';
        
        // Find existing user with the target admin email
        let admin = await User.findOne({ email: adminEmail });
        
        if (admin) {
            console.log(`[Seeder] Admin user (${adminEmail}) already exists. Resetting profile details and password...`);
            admin.name = 'System Administrator';
            admin.password = 'AdminPassword123!';
            admin.role = 'admin';
            // Save triggers the bcrypt pre-save password-hashing hook
            await admin.save();
            console.log('[Seeder] Admin user updated successfully.');
        } else {
            console.log(`[Seeder] Admin user (${adminEmail}) not found. Creating a new admin profile...`);
            admin = new User({
                name: 'System Administrator',
                email: adminEmail,
                password: 'AdminPassword123!',
                role: 'admin'
            });
            await admin.save();
            console.log('[Seeder] Admin user seeded successfully.');
        }
        
        console.log('[Seeder] Seeding process complete.');
        mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('[Seeder Error] Failed to seed database:', error.message);
        process.exit(1);
    }
};

seedAdmin();
