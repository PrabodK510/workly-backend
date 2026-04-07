const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/workly_marketplace').then(async () => {
    const db = mongoose.connection.db;
    // We read using native driver bypass to see RAW data WITHOUT decrypting getters
    const workers = await db.collection('workers').find({}).toArray();
    
    console.log("=== RAW MONGODB WORKERS COLLECTION DATA ===");
    console.log(JSON.stringify(workers, null, 2));
    
    process.exit(0);
}).catch(console.error);
