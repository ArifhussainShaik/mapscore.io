
const mongoose = require('mongoose');

async function run() {
    if (!process.env.MONGODB_URI) {
        console.error("No MONGODB_URI in .env.local");
        process.exit(1);
    }

    await mongoose.connect(process.env.MONGODB_URI, { dbName: "Localscore" });
    console.log("Connected to MongoDB.");

    const userSchema = new mongoose.Schema({ email: String, credits: Number }, { strict: false });
    const User = mongoose.models.User || mongoose.model('User', userSchema);

    const email = "arifbinmahaboob@gmail.com";
    const user = await User.findOne({ email });
    if (!user) {
        console.log("User not found: " + email);
        process.exit(1);
    }

    user.credits = (user.credits || 0) + 30;
    await user.save();

    console.log(`Added 30 credits. New balance for ${email}: ${user.credits}`);
    process.exit(0);
}
run().catch(console.error);
