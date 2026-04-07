const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Models
const Worker = require('./models/Worker');
const Customer = require('./models/Customer');
const Transaction = require('./models/Transaction');
const Category = require('./models/Category');

async function seedCleanData() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/workly_marketplace', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });

        console.log("Connected. Purging dirty old test data...");
        await Worker.deleteMany({});
        await Customer.deleteMany({});
        await Transaction.deleteMany({});
        await Category.deleteMany({});

        console.log("Injecting fresh Synchronized Configuration...");
        const cats = await Category.insertMany([
            { name: 'House Cleaning', commissionRate: 15, iconName: 'home' },
            { name: 'Plumbing Works', commissionRate: 18, iconName: 'tool' },
            { name: 'IT & Hardware', commissionRate: 10, iconName: 'monitor' },
            { name: 'Landscape & Garden', commissionRate: 20, iconName: 'sun' }
        ]);

        console.log("Injecting fresh Customers...");
        const pass = await bcrypt.hash('password123', 10);
        const customers = await Customer.insertMany([
            { name: 'Samith Perera', phone: '0771234567', password: pass },
            { name: 'Nadeesha Fernando', phone: '0719876543', password: pass }
        ]);

        console.log("Injecting beautifully matched Workers...");
        const workers = await Worker.insertMany([
            { 
               name: 'Ruwan Kumara', phone: '0751112222',
               serviceCategory: 'Plumbing Works', status: 'active', adminVerified: true,
               nicNumber: '198545671234', bankAccountNumber: '1002345678'
            },
            { 
               name: 'Kamal Silva', phone: '0723334444',
               serviceCategory: 'House Cleaning', status: 'active', adminVerified: true,
               nicNumber: '199086754321', bankAccountNumber: '9988776655'
            },
            { 
               name: 'Amali Dias', phone: '0765556666',
               serviceCategory: 'IT & Hardware', status: 'pending', adminVerified: false,
               nicNumber: '200112345678', bankAccountNumber: '1234567890'
            }
        ]);

        console.log("Mocking Live Real-world Transactions (Ledger)...");
        // Transaction 1: Plumbing
        await Transaction.create({
            workerId: workers[0]._id,
            customerName: customers[0].name,
            serviceType: workers[0].serviceCategory,
            grossFee: 5000,
            adminCommissionRate: 18,
            adminCommissionCut: 900,
            workerNetPayout: 4100
        });

        // Transaction 2: Cleaning
        await Transaction.create({
            workerId: workers[1]._id,
            customerName: customers[1].name,
            serviceType: workers[1].serviceCategory,
            grossFee: 3500,
            adminCommissionRate: 15,
            adminCommissionCut: 525,
            workerNetPayout: 2975
        });

        console.log("🎉 ALL DONE! Hard Reset Complete. Perfectly meshed data has been deployed.");
        process.exit();

    } catch (e) {
        if (e.name === 'ValidationError') {
            console.error("Validation Error:", JSON.stringify(e.errors, null, 2));
        } else {
            console.error("Crash during seed:", e);
        }
        process.exit(1);
    }
}

seedCleanData();
