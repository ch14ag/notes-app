import mongoose from "mongoose";

export default async function connectDb() {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}${process.env.DB_NAME}`);
    return connectionInstance;
  } catch (err: unknown) {
    console.error("error connecting to mongodb", err);
    process.exit(1);
  }
}
