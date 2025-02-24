import TwitchUserCacheFetchStrategy from '../cache/fetchers/TwitchUser.cache.fetch.strategy';
import TwitchUserCache from '../cache/TwitchUser.cache';
import APIClient from '../clients/Api.client';
import EventSubClient from '../clients/EventSub.client';
import { ChannelOptionsProvider } from '../providers/ChannelOptions.provider';
import ListenChannelsProvider from '../providers/ListenChannels.provider';
import TokenRepositoryProvider from '../providers/Token.repository.provider';
import RateLimiterService from '../services/RateLimiter.service';
import { TokenService } from '../services/Token.service';
import { ClassOrValue, IModuleDefinition, Provider } from '../types/Module.types';
import DINames from '../utils/DI.names';

export type ChatBotModuleConfig = {
    listenChannels: ClassOrValue<DINames.UserDefinedListenChannelsProvider>;
    channelOptions: ClassOrValue<DINames.UserDefinedChannelOptionsProvider>;
    tokenRepository: ClassOrValue<DINames.UserDefinedTokenRepositoryProvider>;
}

export default class ChatBotModule {
    static forRoot(config: ChatBotModuleConfig): IModuleDefinition {
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
                // TODO: Move to CacheModule - use cache only if configured (otherwise use API Directly)
                { token: DINames.TwitchUserCacheFetchStrategy, useClass: TwitchUserCacheFetchStrategy },
                { token: DINames.TwitchUserCache, useClass: TwitchUserCache },
                // TODO: Move to RateLimiterModule - use rate limiter only if configured (otherwise skip rate limiting)
                { token: DINames.RateLimiterService, useClass: RateLimiterService }
            ]
        };
    }
}