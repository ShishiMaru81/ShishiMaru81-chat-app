import { Connection } from "mongoose";
import type { MongoClient } from "mongodb";

declare global {
    var mongoose: {
        conn: Connection | null;
        promise: Promise<Connection> | null
    }
    var upload_url: {
        uploadUrl: string | null;
    }
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

export { }