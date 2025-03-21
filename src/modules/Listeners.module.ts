import ChatDataInjectorService from '../services/ChatDataInjector.service';
import ChatListenersService from '../services/ChatListeners.service';
import { IModuleDefinition, ListenersModuleForRootConfig, ListenersModuleForFeatureConfig } from '../types/Module.types';
import DINames from '../utils/DI.names';

export default class ListenersModule {
    static forRoot(config: ListenersModuleForRootConfig): IModuleDefinition {
        return {
            module: ListenersModule,
            userProviders: [{ token: DINames.Listeners, useValue: config.listeners }],
            providers: [
                { token: DINames.ChatListenersService, useClass: ChatListenersService },
                { token: DINames.ChatDataInjectorService, useClass: ChatDataInjectorService },
            ],
        };
    }

    static forFeature(config: ListenersModuleForFeatureConfig): ListenersModuleForFeatureConfig {
        return {
            ...config
        }
    }
}
