import TwitchUserCacheFetchStrategy from "../cache/fetchers/TwitchUser.cache.fetch.strategy";
import TwitchUserCache from "../cache/TwitchUser.cache";
import APIClient from "../clients/Api.client";
import EventSubClient from "../clients/EventSub.client";
import WebsocketClient from "../clients/Websocket.client";
import { ChannelOptionsProvider } from "../providers/ChannelOptions.provider";
import ListenChannelsProvider from "../providers/ListenChannels.provider";
import TokenRepositoryProvider from "../providers/Token.repository.provider";
import ChatCommandsService from "../services/ChatCommands.service";
import ChatDataInjectorService from "../services/ChatDataInjector.service";
import ChatListenersService from "../services/ChatListeners.service";
import ConfigService from "../services/Config.service";
import RateLimiterService from "../services/RateLimiter.service";
import { TokenService } from "../services/Token.service";
import DINames from "../utils/DI.names";
import { LoggerFactory } from "../utils/Logger";
import { IChannelOptionsProvider } from "./ChannelOptions.provider";
import { ChatCommandExecution } from "./ChatCommand.types";
import { ChatListenerExecution } from "./ChatListener.types";
import { IListenChannelsProvider } from "./ListenChannels.provider.types";
import { ITokenRepositoryProvider } from "./Token.repository.types";

export type ClassOrValue<T extends DINames> = Omit<Provider<T>, 'token'>;

export type Provider<T extends DINames, O = MappedDINames[T]> = {
    token: T;
    useClass?: new (...args: any[]) => O;
    useValue?: O;
};

export interface IModuleDefinition {
    module: any;
    userProviders?: Array<Provider<any>>;
    providers: Array<Provider<any>>;
}

export type MappedDINames = {
    [DINames.ConfigService]: ConfigService;
    [DINames.LoggerFactory]: LoggerFactory;
    [DINames.TokenService]: TokenService;
    [DINames.RateLimiterService]: RateLimiterService;
    [DINames.EventSubClient]: EventSubClient;
    [DINames.WebsocketClient]: WebsocketClient;
    [DINames.APIClient]: APIClient;
    [DINames.ListenChannelsProvider]: ListenChannelsProvider;
    [DINames.ChannelOptionsProvider]: ChannelOptionsProvider<any>;
    [DINames.TokenRepositoryProvider]: TokenRepositoryProvider;
    [DINames.UserDefinedListenChannelsProvider]: IListenChannelsProvider;
    [DINames.UserDefinedChannelOptionsProvider]: IChannelOptionsProvider<any>;
    [DINames.UserDefinedTokenRepositoryProvider]: ITokenRepositoryProvider;
    [DINames.ChatCommandsService]: ChatCommandsService;
    [DINames.ChatListenersService]: ChatListenersService;
    [DINames.ChatDataInjectorService]: ChatDataInjectorService;
    [DINames.TwitchUserCacheFetchStrategy]: TwitchUserCacheFetchStrategy;
    [DINames.TwitchUserCache]: TwitchUserCache;
    [DINames.Listeners]: ChatListenerExecution[];
    [DINames.Commands]: ChatCommandExecution[];
};

// Commands Module

export type CommandsModuleForRootConfig = {
    commands: (new () => ChatCommandExecution)[];
};

export type CommandsModuleForFeatureConfig = {
    name: string;
    keyword: string;
    aliases?: string[];
    ignoreCase?: boolean;
    transistent?: boolean;
}

// Listeners Module

export type ListenersModuleForRootConfig = {
    listeners: (new () => ChatListenerExecution)[];
};

export type ListenersModuleForFeatureConfig = {
    name: string;
    transient?: boolean;
}

// APIRateLimiter Module

export type APIRateLimiterModuleForRootConfig = {};

export type APIRateLimiterModuleForFeatureConfig = {}

// Cache Module

export type CacheModuleForRootConfig = {}

export type CacheModuleForFeatureConfig = {}

// ChatBot Module

export type ChatBotModuleForRootConfig = {
    listenChannels: ClassOrValue<DINames.UserDefinedListenChannelsProvider>;
    channelOptions: ClassOrValue<DINames.UserDefinedChannelOptionsProvider>;
    tokenRepository: ClassOrValue<DINames.UserDefinedTokenRepositoryProvider>;
}

export type ChatBotModuleForFeatureConfig = {}