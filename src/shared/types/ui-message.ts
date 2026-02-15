import { ClientMessage } from "./client-message.js";
import { clientTempMessage } from "./client-tempMessage.js";

export type UIMessage = ClientMessage | clientTempMessage;