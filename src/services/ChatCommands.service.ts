import DINames from '../utils/DI.names';
import { Logger, LoggerFactory } from '../utils/Logger';
import { GeneralContainer, GeneralFactory, GeneralRegistry, GeneralRegistryEntry } from '../types/Decorator.storage.types';
import { ChatCommandExecution, ChatCommandInstance } from '../types/ChatCommand.types';
import ChannelChatMessageEventData from '../types/EventSub_Events/ChannelChatMessageEventData.types';
import { ChannelOptionsProvider } from '../providers/ChannelOptions.provider';
import ChatDataInjectorService from './ChatDataInjector.service';
import APIClient from '../clients/Api.client';
import { CommandsModuleForFeatureConfig } from '../types/Module.types';
import { DIContainer } from '../di/Container';

export default class ChatCommandsService {
    private static readonly chatCommandsContainer = GeneralContainer.getInstance<GeneralFactory, ChatCommandExecution>();
    private static readonly chatCommandRegistry = GeneralRegistry.getInstance<ChatCommandInstance, CommandsModuleForFeatureConfig>();

    static getCommandRegistry(): GeneralRegistry<ChatCommandInstance, CommandsModuleForFeatureConfig> {
        return this.chatCommandRegistry;
    }

    static getChatCommandsContainer(): GeneralContainer<GeneralFactory, ChatCommandExecution> {
        return this.chatCommandsContainer;
    }

    static registerCommand(target: any, options: Required<CommandsModuleForFeatureConfig>): void {
        const logger = new Logger('ChatCommandsService:RegisterCommand');
        logger.log(`Registering command ${options.name}`);

        // Register the command in the container
        ChatCommandsService.chatCommandsContainer.set({
            id: target,
            factory: () => new target(),
            transient: options.transistent,
            enabled: false, // Default disabled (enable by passing the command class to the constructor)
        });

        const instance = ChatCommandsService.chatCommandsContainer.get(target) as ChatCommandInstance;

        // Check if the command implements the required methods
        if (typeof instance.execution !== 'function') {
            throw new Error(`Command ${options.name} does not implement the required method 'execution'`);
        }

        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(instance))
            .map((m) => {
                const methodName = m as keyof ChatCommandInstance;
                if (m === 'constructor') return undefined;
                if (typeof instance[methodName] !== 'function') return undefined;
                return m;
            })
            .filter((m) => m !== undefined) as (keyof ChatCommandInstance)[];

        ChatCommandsService.chatCommandRegistry.register(target, options, methods);
    }

    private readonly apiClient: APIClient;
    private readonly channelOptionsProvider: ChannelOptionsProvider;
    private readonly chatDataInjector: ChatDataInjectorService;

    private readonly logger: Logger;
    private readonly allKeywords: string[] = [];

    constructor() {
        this.logger = LoggerFactory.createLogger('ChatCommandsService');

        this.apiClient = DIContainer.get<APIClient>(DINames.APIClient);
        this.channelOptionsProvider = DIContainer.get<ChannelOptionsProvider>(DINames.ChannelOptionsProvider);
        this.chatDataInjector = DIContainer.get<ChatDataInjectorService>(DINames.ChatDataInjectorService);
        const commands = DIContainer.get<ChatCommandExecution[]>(DINames.Commands);

        commands.forEach((command) => {
            ChatCommandsService.getChatCommandsContainer().enable(command);
        });

        this.logger.debug(`Initialized`);
    }

    getCommandRegistry(): GeneralRegistry<ChatCommandInstance, CommandsModuleForFeatureConfig> {
        return ChatCommandsService.chatCommandRegistry;
    }

    getChatCommandsContainer(): GeneralContainer<GeneralFactory, ChatCommandExecution> {
        return ChatCommandsService.chatCommandsContainer;
    }

    getAllKeywords(): string[] {
        const commands = this.getCommandRegistry().getRegisteredEntries();
        // If keywords are already cached, return them
        if (this.allKeywords.length != 0 && commands.length != 0) return this.allKeywords;
        // If not, cache them and return
        const keywords = commands.map((c) => this.getKeywords(c)).flat();
        if (this.detectDuplicates(keywords)) throw new Error(`Keywords are duplicated between commands`);
        this.allKeywords.push(...keywords);
        return this.allKeywords;
    }

    async handleCommand(data: ChannelChatMessageEventData): Promise<void> {
        const channelOptions = await this.channelOptionsProvider.getChannelOptions(data.broadcaster_user_id);
        const commandPrefix = channelOptions.prefix;
        if (!data.message.text.startsWith(commandPrefix)) {
            this.logger.debug(`Ignoring message ${data.message_id} (#${data.broadcaster_user_login}) - Missing prefix '${commandPrefix}'`);
            return;
        }

        const keywords = this.getAllKeywords();

        const message = data.message.text;
        const messageParts = message.split(' ');

        const commandKeyword = messageParts[0].slice(commandPrefix.length);
        const commandKeywordLower = commandKeyword.toLowerCase();

        if (!keywords.includes(commandKeyword) && !keywords.includes(commandKeywordLower)) return;

        const map = this.getKeywordsCommandMap();
        const command = map.find((m) => m.keywords.includes(commandKeyword) || m.keywords.includes(commandKeywordLower));
        if (!command) return;

        let instance: ChatCommandInstance;
        try {
            instance = this.getChatCommandsContainer().get(command.entry.target, true) as ChatCommandInstance;
        } catch (error) {
            return;
        }
        const methods = command.entry.methods;

        try {
            if (methods.includes('guard')) {
                const args = await this.chatDataInjector.injectParameters(instance, 'guard', data);
                const guardResult = await instance.guard(...args);
                if (!guardResult.canAccess) {
                    this.logger.log(`Guard failed for command ${command.entry.options.name} for user ${data.chatter_user_login} in channel ${data.broadcaster_user_login} with reason: ${guardResult.message}`);
                    if (guardResult.message?.length != 0) this.apiClient.sendMessage(data.broadcaster_user_id, guardResult.message || 'You cannot execute this command!', data.message_id);
                    return;
                }
            }

            if (methods.includes('preExecution')) {
                const args = await this.chatDataInjector.injectParameters(instance, 'preExecution', data);
                await instance.preExecution(...args);
            }

            // Brackets for args isolation
            {
                const args = await this.chatDataInjector.injectParameters(instance, 'execution', data);
                await instance.execution(...args);
            }

            if (methods.includes('postExecution')) {
                const args = await this.chatDataInjector.injectParameters(instance, 'postExecution', data);
                await instance.postExecution(...args);
            }
        } catch (error) {
            this.logger.error(`Error while executing command ${command.entry.options.name}: ${error}`);
        }
    }

    private getKeywordsCommandMap(): { keywords: string[]; entry: GeneralRegistryEntry<ChatCommandInstance, CommandsModuleForFeatureConfig> }[] {
        const commands = this.getCommandRegistry().getRegisteredEntries();
        const map = commands.map((entry) => {
            return {
                keywords: this.getKeywords(entry),
                entry,
            };
        });
        return map;
    }

    private getKeywords(entry: GeneralRegistryEntry<ChatCommandInstance, CommandsModuleForFeatureConfig>): string[] {
        const keywords = [entry.options.keyword, ...entry.options.aliases].map((keyword) => {
            if (entry.options.ignoreCase) keyword = keyword.toLowerCase();
            return keyword;
        });
        if (this.detectDuplicates(keywords)) throw new Error(`Keywords are duplicated in command '${entry.options.name}'`);
        return keywords;
    }

    private detectDuplicates(keywords: string[]): boolean {
        const uniqueKeywords = new Set(keywords);
        return keywords.length != uniqueKeywords.size;
    }
}
