require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./models/Category');

mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/workly').then(async () => {
    await Category.deleteMany({});
    await Category.insertMany([
        { name: 'Masonry & Concrete', commissionRate: 20, iconName: 'tool' },
        { name: 'Plumbing & Piping', commissionRate: 15, iconName: 'target' },
        { name: 'Electrical & Installation', commissionRate: 14, iconName: 'zap' },
        { name: 'Painting & Finishes', commissionRate: 12, iconName: 'edit-2' },
        { name: 'AC & Cooling Servicing', commissionRate: 18, iconName: 'wind' }
    ]);
    console.log("✅ Successfully Bootstrapped Dynamic Platform Categories.");
    process.exit(0);
}).catch(e => {
    console.error(e);
    process.exit(1);
});
