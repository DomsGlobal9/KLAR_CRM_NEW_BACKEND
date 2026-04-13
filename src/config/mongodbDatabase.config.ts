import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const connections: Record<string, mongoose.Connection> = {};

const connectDB = async () => {
  try {
    const mongoUrls = process.env.MONGO_URLS;

    if (!mongoUrls) {
      throw new Error("MONGO_URLS not found in .env");
    }

    // Use trim() to handle any accidental spaces in the .env string
    const dbEntries = mongoUrls.split(",").map(entry => entry.trim());

    await Promise.all(
      dbEntries.map(async (entry, index) => {
        let name = `db${index + 1}`;
        let url = entry;



        if (entry.includes("|")) {
          const [parsedName, parsedUrl] = entry.split("|");
          name = parsedName.trim();
          url = parsedUrl.trim();
        }

        const conn = mongoose.createConnection(url, {
          maxPoolSize: 10, 
        });

        // Listen for runtime errors after initial connection
        conn.on("error", (err) => console.error(`❌ MongoDB [${name}] error:`, err));
        conn.on("disconnected", () => console.warn(`⚠️ MongoDB [${name}] disconnected`));

        await conn.asPromise();
        connections[name] = conn;

        console.log(`✅ Connected to DB: ${name}`);
      })
    );
  } catch (error) {
    console.error("❌ MongoDB initial connection error:", error);
    process.exit(1);
  }
};

export const getDB = (name: string): mongoose.Connection => {
  const connection = connections[name];
  if (!connection) {
    throw new Error(`DB Connection "${name}" not found. Available: ${Object.keys(connections).join(", ")}`);
  }
  return connection;
};

export default connectDB;