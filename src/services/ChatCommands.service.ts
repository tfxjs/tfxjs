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
import Utils from '../utils/Utils';

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
        const logger = LoggerFactory.createLogger('ChatCommandsService:RegisterCommand');
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

        this.checkCommandsOptionsConfig();

        this.logger.debug(`Initialized`);
    }

    private checkCommandsOptionsConfig(): void {
        this.logger.debug(`Checking commands options config`);
        const commands = this.getCommandRegistry().getRegisteredEntries();
        const nameToKeywordsMap = commands.map((c) => ({
            name: c.options.name,
            keywords: this.getCommandKeywords(c, true),
        }));

        // Check name duplicates
        const duplicatedNames = Utils.GetDuplicatedValues(nameToKeywordsMap.map((c) => c.name));
        this.logger.debug(`All command names: ${nameToKeywordsMap.map((c) => c.name).join(', ')}`);
        if (duplicatedNames.length != 0) {
            const errorMessage = `Command names are duplicated: ${duplicatedNames.join(', ')}. You have to use unique names for each command.`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        } else {
            this.logger.debug(`No duplicated command names found.`);
        }

        // Check keyword duplicates (command-scope)
        for (const nameToKeywordsItem of nameToKeywordsMap) {
            const duplicatedKeywords = Utils.GetDuplicatedValues(nameToKeywordsItem.keywords);
            this.logger.debug(`Command ${nameToKeywordsItem.name} has keywords: ${nameToKeywordsItem.keywords.join(', ')}`);
            if (duplicatedKeywords.length != 0) {
                const errorMessage = `Command ${nameToKeywordsItem.name} has duplicated keywords: ${duplicatedKeywords.join(', ')}. You should use unique keywords for each command.`;
                this.logger.warn(errorMessage);
            } else {
                this.logger.debug(`Command ${nameToKeywordsItem.name} has unique keywords.`);
            }
        }

        // Check keyword duplicates (global)
        const allKeywords = this.getAllCommandsKeywords();
        this.logger.debug(`All global keywords: ${allKeywords.join(', ')}`)
        const duplicatedKeywords = Utils.GetDuplicatedValues(allKeywords);
        if (duplicatedKeywords.length != 0) {
            const errorMessage = `Global duplicated keywords: ${duplicatedKeywords.join(', ')}. You have to use unique keywords for each command in global scope.`;
            this.logger.error(errorMessage);
            throw new Error(errorMessage);
        } else {;
            this.logger.debug(`No global duplicated keywords found.`);
        }
    }

    /**
     * Get all keywords from all registered commands
     * @returns All keywords
     */
    private getAllCommandsKeywords(): string[] {
        if (this.allKeywords.length != 0) return this.allKeywords;

        const commands = this.getCommandRegistry().getRegisteredEntries();
        const keywords = commands.map((c) => this.getCommandKeywords(c)).flat();
        this.allKeywords.push(...keywords);
        return this.allKeywords;
    }

    getCommandRegistry(): GeneralRegistry<ChatCommandInstance, CommandsModuleForFeatureConfig> {
        return ChatCommandsService.chatCommandRegistry;
    }

    getChatCommandsContainer(): GeneralContainer<GeneralFactory, ChatCommandExecution> {
        return ChatCommandsService.chatCommandsContainer;
    }

    async handleCommand(data: ChannelChatMessageEventData): Promise<void> {
        const channelOptions = await this.channelOptionsProvider.getChannelOptions(data.broadcaster_user_id);
        const commandPrefix = channelOptions.prefix;
        if (!data.message.text.startsWith(commandPrefix)) {
            this.logger.debug(`Ignoring message ${data.message_id} (#${data.broadcaster_user_login}) - Missing prefix '${commandPrefix}'`);
            return;
        }

        const keywords = this.getAllCommandsKeywords();

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

    /**
     * Get keywords-command map
     * @returns Keywords without duplicates and corresponding command entry
     */
    private getKeywordsCommandMap(): { keywords: string[]; entry: GeneralRegistryEntry<ChatCommandInstance, CommandsModuleForFeatureConfig> }[] {
        const commands = this.getCommandRegistry().getRegisteredEntries();
        const map = commands.map((entry) => ({
            keywords: this.getCommandKeywords(entry),
            entry,
        }));
        return map;
    }

    /**
     * Get command keywords
     * @param entry Command entry
     * @returns Command keywords (keyword + aliases)
     */
    private getCommandKeywords(entry: GeneralRegistryEntry<ChatCommandInstance, CommandsModuleForFeatureConfig>, withDuplicates: boolean = false): string[] {
        const keywords = [entry.options.keyword, ...entry.options.aliases].map((keyword) => {
            if (entry.options.ignoreCase) keyword = keyword.toLowerCase();
            return keyword;
        });
        return withDuplicates ? keywords : Array.from(new Set(keywords));
    }
}
