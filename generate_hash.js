const bcrypt = require('bcrypt-nodejs');

const password = "Smart@1800$";
const email = "nyirinkindimarcel@gmail.com";
const saltRounds = 10;

// Combine password and email (just like your User model does)
const combinedString = password + email.toLowerCase().trim();

console.log("Generating hash for:", combinedString);

bcrypt.genSalt(saltRounds, function(err, salt) {
    if (err) {
        console.error("Error generating salt:", err);
        return;
    }
    
    bcrypt.hash(combinedString, salt, null, function(err, hash) {
        if (err) {
            console.error("Error generating hash:", err);
            return;
        }
        
        console.log("\n======================");
        console.log("Generated Hash:");
        console.log(hash);
        console.log("======================\n");
        console.log("Now run this command in MongoDB:");
        console.log(`\nuse EshuriDB\n`);
        console.log(`db.users.updateOne(`);
        console.log(`  { email: "nyirinkindimarcel@gmail.com" },`);
        console.log(`  { $set: { password: "${hash}", updatedAt: new Date() } }`);
        console.log(`)\n`);
    });
});