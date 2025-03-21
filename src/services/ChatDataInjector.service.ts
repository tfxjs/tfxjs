import "reflect-metadata";
import DINames from "../utils/DI.names";
import { Logger, LoggerFactory } from "../utils/Logger";
import { ChatDataType, ChatDataTypeMap } from "../types/ChatDataInjector.types";
import ChannelChatMessageEventData from "../types/EventSub_Events/ChannelChatMessageEventData.types";
import {ChatterUser, PartialTwitchUser, TwitchUser} from "../objects/TwitchUser.object";
import {ChatMessage, TwitchChatMessage} from "../objects/ChatMessage.object";
import { ChannelOptionsProvider } from "../providers/ChannelOptions.provider";
import { GetListenerChannelsRefreshFunction } from "../providers/ListenChannels.provider";
import { DIContainer } from "../di/Container";

export default class ChatDataInjectorService {
    private readonly logger: Logger;

    constructor() {
        this.logger = LoggerFactory.createLogger('ChatDataInjector');
        this.logger.debug('Initialized');
    }

    private async getChatData<T extends ChatDataType>(
        type: T,
        data: ChannelChatMessageEventData
    ): Promise<ChatDataTypeMap[T]> {
        const dataMaps: { [key in ChatDataType]: (data: ChannelChatMessageEventData) => (Promise<any> | any) } = {
            [ChatDataType.RAW]: (data: ChannelChatMessageEventData) => data,
            [ChatDataType.MESSAGE_USER]: (data: ChannelChatMessageEventData) => new ChatterUser(data),
            [ChatDataType.SENDER_DATA]: (data: ChannelChatMessageEventData) => new PartialTwitchUser({
                id: data.chatter_user_id,
                login: data.chatter_user_login,
                name: data.chatter_user_name
            }),
            [ChatDataType.SENDER]: (data: ChannelChatMessageEventData) => new TwitchUser(data.chatter_user_id),
            [ChatDataType.BROADCASTER_DATA]: (data: ChannelChatMessageEventData) => new PartialTwitchUser({
                id: data.broadcaster_user_id,
                login: data.broadcaster_user_login,
                name: data.broadcaster_user_name
            }),
            [ChatDataType.BROADCASTER]: (data: ChannelChatMessageEventData) => new TwitchUser(data.broadcaster_user_id),
            [ChatDataType.MESSAGE_DATA]: (data: ChannelChatMessageEventData) => new ChatMessage(data),
            [ChatDataType.MESSAGE]: (data: ChannelChatMessageEventData) => new TwitchChatMessage(data),
            // TODO: Remove
            [ChatDataType.OPTIONS_PROVIDER]: (data: ChannelChatMessageEventData) => DIContainer.get(DINames.ChannelOptionsProvider),
            // TODO: Remove
            [ChatDataType.CHANNEL_OPTIONS]: async (data: ChannelChatMessageEventData) => {
                const provider = DIContainer.get(DINames.ChannelOptionsProvider) as ChannelOptionsProvider;
                return await provider.getChannelOptions(data.broadcaster_user_id);
            },
            // TODO: This is the same as CHANNEL_OPTIONS - Better name
            [ChatDataType.OPTIONS_MANAGER]: (data: ChannelChatMessageEventData) => DIContainer.get(DINames.ChannelOptionsProvider),
            [ChatDataType.API_CLIENT]: (data: ChannelChatMessageEventData) => DIContainer.get(DINames.APIClient),
            [ChatDataType.REFRESH_CHAT_LISTENERS]: (data: ChannelChatMessageEventData) => GetListenerChannelsRefreshFunction()
        };

        const mappedData = await dataMaps[type](data);
        this.logger.debug(`Mapped data for ${type}: ${mappedData}`);
        return mappedData;
    }

    async injectParameters(target: any, methodName: string, data: ChannelChatMessageEventData) {
        const paramMetadata = Reflect.getMetadataKeys(target, methodName)
            .filter((key: string) => Object.values(ChatDataType).includes(key as ChatDataType))
            .reduce((acc: any, key: string) => {
                acc[key] = Reflect.getMetadata(key, target, methodName) || [];
                return acc;
            }, {});

        this.logger.debug(`Injecting parameters for ${methodName} with metadata: ${JSON.stringify(paramMetadata
        )}`);

        const args = await Promise.all(
            Object.keys(paramMetadata).flatMap((key: string) => {
                const type = key as ChatDataType;
                return paramMetadata[key].map(async (paramIndex: number) => {
                    return await this.getChatData(type, data);
                });
            })
        );

        return args.reverse();
    }
}