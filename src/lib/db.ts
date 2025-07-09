
import mongoose from "mongoose";


const MONGODB_URI = process.env.MONGODB_URI!

if (!MONGODB_URI) {
    throw new Error("please define mongodb_uri is env file veriables")
}

let cached = global.mongoose
if (!cached) {
    cached = global.mongoose = { conn: null, promise: null }
}

export async function connectToDatabase() {
    if (cached.conn) {
        return cached.conn
    }
    if (!cached.promise) {
        const opctions = {
            bufferCommands: true,
            maxPoolSize: 10,

        }
        mongoose
            .connect(MONGODB_URI, opctions)
            .then(() => mongoose.connection)
    }
    try {
        cached.conn = await cached.promise
    } catch (error) {
        cached.promise = null
        throw error

    }
    return cached.conn
}