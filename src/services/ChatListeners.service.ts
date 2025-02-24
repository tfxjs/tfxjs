import { Inject, Service } from 'typedi';
import { GeneralContainer, GeneralFactory, GeneralRegistry, GeneralRegistryEntry } from '../types/Decorator.storage.types';
import { ChatListenerDecoratorOptions, ChatListenerExecution, ChatListenerInstance } from '../types/ChatListener.types';
import ChannelChatMessageEventData from '../types/EventSub_Events/ChannelChatMessageEventData.types';
import { Logger, LoggerFactory } from '../utils/Logger';
import DINames from '../utils/DI.names';
import { ChannelOptionsProvider } from '../providers/ChannelOptions.provider';
import ChatDataInjectorService from './ChatDataInjector.service';
import { listeners } from 'process';

@Service(DINames.ChatListenersService)
export default class ChatListenersService {
    private static readonly chatListenersContainer = GeneralContainer.getInstance<GeneralFactory, ChatListenerExecution>();
    private static readonly chatListenerRegistry = GeneralRegistry.getInstance<ChatListenerInstance, ChatListenerDecoratorOptions>();

    static getListenersRegistry(): GeneralRegistry<ChatListenerInstance, ChatListenerDecoratorOptions> {
        return this.chatListenerRegistry;
    }

    static getChatListenersContainer(): GeneralContainer<GeneralFactory, ChatListenerExecution> {
        return this.chatListenersContainer;
    }

    static registerListener(target: any, options: Required<ChatListenerDecoratorOptions>): void {
        const logger = new Logger('ChatListenerDecorator:RegisterListener');
        logger.debug(`Registering listener ${options.name}`);

        // Register the listener in the container
        this.chatListenersContainer.set({
            id: target,
            factory: () => new target(),
            transient: options.transient,
            enabled: false, // Default disabled (enable by passing the listener class to the constructor)
        });

        const instance = this.chatListenersContainer.get(target) as ChatListenerInstance;

        // Check if the listener implements the required methods
        if (typeof instance.execution !== 'function') {
            throw new Error(`Listener ${options.name} does not implement the required method 'execution'`);
        }

        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
            .map((m) => {
                const methodName = m as keyof ChatListenerInstance;
                if (m === 'constructor') return undefined;
                if (typeof instance[methodName] !== 'function') return undefined;
                return m;
            })
            .filter((m) => m !== undefined) as (keyof ChatListenerInstance)[];

        this.chatListenerRegistry.register(target, options, methods);

        logger.debug(`Registered listener ${options.name} with methods: ${methods.join(', ')}`);
    }

    private readonly logger: Logger;
    constructor(
        @Inject(DINames.ChatDataInjectorService) private readonly chatDataInjector: ChatDataInjectorService,
        @Inject(DINames.Listeners) listeners: ChatListenerExecution[]
    ) {
        this.logger = LoggerFactory.createLogger('ChatListenersService');

        listeners.forEach((listener) => {
            ChatListenersService.getChatListenersContainer().enable(listener);
        });

        this.logger.debug('Initialized');
    }

    getListenersRegistry(): GeneralRegistry<ChatListenerInstance, ChatListenerDecoratorOptions> {
        return ChatListenersService.chatListenerRegistry;
    }

    getChatListenersContainer(): GeneralContainer<GeneralFactory, ChatListenerExecution> {
        return ChatListenersService.chatListenersContainer;
    }

    handleListener(data: ChannelChatMessageEventData): void {
        this.logger.debug(`Handling listener for message ID: ${data.message_id}`);
        const listeners = this.getListenersRegistry().getRegisteredEntries();
        listeners.forEach(async (listener) => {
            let instance: ChatListenerInstance;
            try {
                instance = this.getChatListenersContainer().get(listener.target, true);
            } catch (error) {
                this.logger.error(`Error while getting listener instance ${listener.options.name}: ${error}`);
                return;
            }

            try {
                const args = await this.chatDataInjector.injectParameters(instance, 'execution', data);
                this.logger.debug(`Executing listener ${listener.options.name} with args: ${args}`);
                instance.execution(...args);
            } catch (error) {
                this.logger.error(`Error while executing listener ${listener.options.name}: ${error}`);
            }
        });
    }
}
