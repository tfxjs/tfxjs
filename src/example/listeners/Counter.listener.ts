import { ChatListener } from "../../decorators/ChatListener.decorator";
import ListenersModule from "../../modules/Listeners.module";
import { ChatListenerExecution } from "../../types/ChatListener.types";

// @ChatListener(ListenersModule.forFeature({
//     name: 'Counter',
//     transient: false
// }))
/**
 * @deprecated This listener is just for testing purposes. It wont be working in production.
 */
export default class CounterListener implements ChatListenerExecution {
    private messageCount: number = 0;

    async execution(): Promise<void> {
        this.messageCount++;
        if(this.messageCount % 100 === 0) console.log(`Received ${this.messageCount} messages in total`);
    }
}