import { socket } from '@/lib/socketClient';
import { useOfflineStore } from '@/store/offline-store';
//import { useConversationStore } from '@/store/chat-store';
//import { IMessagePopulated } from '@/models/Message';

export async function setupOfflineResender() {
    const offlineStore = useOfflineStore.getState();
    //const chatStore = useConversationStore.getState();

    // Load any saved messages into memory
    await offlineStore.loadQueue();

    // Always log connection changes
    socket.on('connect', async () => {
        console.log('[Socket] Reconnected ✅ — resending queued messages...');

        // Refresh queue from Dexie again in case new ones were added while offline
        await offlineStore.loadQueue();
        const messages = useOfflineStore.getState().offlineQueue;

        if (!messages.length) {
            console.log('[Offline] No queued messages found.');
            return;
        }

        for (const msg of messages) {
            console.log('[Offline] Retrying message:', msg.tempId);

            // socket.emit('sendMessage', msg, async (ack: { success: boolean; serverMessage: { serverMessage: IMessagePopulated } }) => {
            //     if (ack?.success) {
            //         console.log('[Offline] Message resent successfully:', msg.tempId);
            //         await offlineStore.removeFromQueue(msg.tempId);
            //         chatStore.replaceTempMessage(msg.tempId, ack.serverMessage);
            //     } else {
            //         console.warn('[Offline] Retry failed for:', msg.tempId);
            //     }
            // });
        }
    });

    socket.on('disconnect', () => {
        console.warn('[Socket] Disconnected — messages will be queued.');
    });
}