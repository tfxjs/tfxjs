import ChatListenersService from '../services/ChatListeners.service';
import { ChatListenerExecution } from '../types/ChatListener.types';
import { IModuleDefinition } from '../types/Module.types';
import DINames from '../utils/DI.names';

export type ListenersModuleConfig = {
    listeners: (new () => ChatListenerExecution)[];
};

export default class ListenersModule {
    static forRoot(config: ListenersModuleConfig): IModuleDefinition {
        return {
            module: ListenersModule,
            userProviders: [{ token: DINames.Listeners, useValue: config.listeners }],
            providers: [
                {
                    token: DINames.ChatListenersService,
                    useClass: ChatListenersService,
                },
            ],
        };
    }
}
