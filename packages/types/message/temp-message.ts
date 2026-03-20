import type { ClientMessage } from "./client-message";

export interface TempMessage extends Omit<ClientMessage, "_id"> {
    _id: `temp_${string}`;
    status: "pending" | "failed";
}