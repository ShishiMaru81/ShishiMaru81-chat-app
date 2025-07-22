import { Connection } from "mongoose";

declare global {
    var mongoose: {
        conn: Connection | null;
        promise: Promise<Connection> | null
    }
    var upload_url: {
        uploadUrl: string | null;
    }
}

export { }