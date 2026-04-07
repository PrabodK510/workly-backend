const mongoose = require('mongoose');

const uri = "mongodb+srv://workly_admin:Prabod%40510@cluster0.eiru23m.mongodb.net/workly_db?retryWrites=true&w=majority&appName=Cluster0";

console.log("Attempting to connect to Atlas...");

mongoose.connect(uri)
  .then(() => {
    console.log("✅ SUCCESS: Connected to Atlas!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ FAILURE: Connection Error:");
    console.error(err);
    process.exit(1);
  });
