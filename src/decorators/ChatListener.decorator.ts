/*

Dekorator do definiowania klas jako listenery czatu

Przykład użycia:

@ChatListener({
    name: string;
    transient?: boolean;
})

*/

import ChatListenersService from "../services/ChatListeners.service";
import { ListenersModuleForFeatureConfig } from "../types/Module.types";

// Decorator
export function ChatListener(options: ListenersModuleForFeatureConfig): ClassDecorator {
    return function (target: any) {
        const allOptions: Required<ListenersModuleForFeatureConfig> = {
            name: options.name,
            transient: options.transient ?? true
        };

        ChatListenersService.registerListener(target, allOptions);
    };
}