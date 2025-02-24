/*

Dekorator do definiowania klas jako listenery czatu

Przykład użycia:

@ChatListener({
    name: string;
    transient?: boolean;
})

*/

import ChatListenersService from "../services/ChatListeners.service";
import { ChatListenerDecoratorOptions, ChatListenerInstance } from "../types/ChatListener.types";

// Decorator
export function ChatListener(options: ChatListenerDecoratorOptions): ClassDecorator {
    return function (target: any) {
        const allOptions: Required<ChatListenerDecoratorOptions> = {
            name: options.name,
            transient: options.transient ?? true
        };

        ChatListenersService.registerListener(target, allOptions);
    };
}