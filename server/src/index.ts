import "dotenv/config";
import { createApp } from "./app.js";
import { connectDB } from "./lib/db.js";

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await connectDB();
    const app = createApp();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
    process.exit(1);
  }
}

start();
