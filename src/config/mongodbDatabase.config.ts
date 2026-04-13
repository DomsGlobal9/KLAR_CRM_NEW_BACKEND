// import mongoose from "mongoose";
// import dotenv from "dotenv";

// dotenv.config(); // ✅ ensure env is loaded here too (safe fallback)

// const connections: Record<string, mongoose.Connection> = {};

// const connectDB = async () => {
//   try {
//     const mongoUrls = process.env.MONGO_URLS;

//     console.log("👉 MONGO_URLS from env:", mongoUrls); // DEBUG

//     if (!mongoUrls) {
//       throw new Error("MONGO_URLS not found in .env");
//     }

//     const dbEntries = mongoUrls.split(",");

//     await Promise.all(
//       dbEntries.map(async (entry, index) => {
//         let name = `db${index + 1}`;
//         let url = entry;

//         // support "name|url" format
//         if (entry.includes("|")) {
//           const parts = entry.split("|");
//           name = parts[0];
//           url = parts[1];
//         }

//         const conn = await mongoose.createConnection(url).asPromise();

//         connections[name] = conn;

//         console.log(`✅ Connected to ${name}`);
//       })
//     );

//   } catch (error) {
//     console.error("❌ MongoDB connection error:", error);
//     process.exit(1);
//   }
// };

// export const getDB = (name: string) => {
//   if (!connections[name]) {
//     throw new Error(`DB ${name} not found`);
//   }
//   return connections[name];
// };

// export default connectDB;
















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
          name = parsedName;
          url = parsedUrl;
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