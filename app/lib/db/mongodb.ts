import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URL;
const dbName = process.env.DATABASE_NAME || "umurava_hackathon_db";

if (!uri) {
  throw new Error("MONGODB_URL is not set in environment variables");
}

// Cache the client across hot reloads in dev
declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

let clientPromise: Promise<MongoClient>;

if (process.env.NODE_ENV === "development") {
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  clientPromise = global._mongoClientPromise;
} else {
  clientPromise = new MongoClient(uri).connect();
}

export async function getDb(): Promise<Db> {
  const client = await clientPromise;
  return client.db(dbName);
}

export { clientPromise };
