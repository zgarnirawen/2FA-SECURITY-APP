import mongoose, { Mongoose } from "mongoose";

const MONGODB_URL = process.env.MONGODB_URL;

interface MongooseConnection {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

// déclaration globale pour TypeScript
declare global {
  // eslint-disable-next-line no-var
  var mongoose: MongooseConnection | undefined;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectToDatabase = async (): Promise<Mongoose> => {
  if (cached!.conn) {
    return cached!.conn;
  }

  if (!MONGODB_URL) {
    throw new Error("Missing MONGODB_URL");
  }

  if (!cached!.promise) {
    cached!.promise = mongoose.connect(MONGODB_URL, {
      dbName: "next-js-app",
      bufferCommands: false,
    });
  }

  cached!.conn = await cached!.promise;
  return cached!.conn;
};
