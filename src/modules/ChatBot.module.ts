import APIClient from '../clients/Api.client';
import EventSubClient from '../clients/EventSub.client';
import WebsocketClient from '../clients/Websocket.client';
import { ChannelOptionsProvider } from '../providers/ChannelOptions.provider';
import ListenChannelsProvider from '../providers/ListenChannels.provider';
import TokenRepositoryProvider from '../providers/Token.repository.provider';
import { TokenService } from '../services/Token.service';
import { ChatBotModuleForRootConfig, IModuleDefinition } from '../types/Module.types';
import DINames from '../utils/DI.names';

export default class ChatBotModule {
    static forRoot(config: ChatBotModuleForRootConfig): IModuleDefinition {
        return {
            module: ChatBotModule,
            userProviders: [
                { token: DINames.UserDefinedListenChannelsProvider, ...config.listenChannels },
                { token: DINames.UserDefinedChannelOptionsProvider, ...config.channelOptions },
                { token: DINames.UserDefinedTokenRepositoryProvider, ...config.tokenRepository } 
            ],
            providers: [
                { token: DINames.ListenChannelsProvider, useClass: ListenChannelsProvider },
                { token: DINames.ChannelOptionsProvider, useClass: ChannelOptionsProvider },
                { token: DINames.TokenRepositoryProvider, useClass: TokenRepositoryProvider },
                { token: DINames.TokenService, useClass: TokenService },
                { token: DINames.EventSubClient, useClass: EventSubClient },
                { token: DINames.APIClient, useClass: APIClient },
                { token: DINames.WebsocketClient, useClass: WebsocketClient }
            ]
        };
    }
}