// =================================
//   API Request Config Builders
// =================================

import Builders, {
    GetAdScheduleRequestConfigBuilder,
    GetAdScheduleResponse,
    GetChannelEditorsRequestConfigBuilder,
    GetChannelEditorsResponse,
    GetChannelInformationRequestConfigBuilder,
    GetChannelInformationResponse,
    GetCheermotesRequestConfigBuilder,
    GetCheermotesResponse,
    GetExtensionAnalyticsRequestConfigBuilder,
    GetExtensionAnalyticsResponse,
    GetExtensionTransactionsRequestConfigBuilder,
    GetExtensionTransactionsResponse,
    GetGameAnalyticsRequestConfigBuilder,
    GetGameAnalyticsResponse,
    GetUsersRequestBuilder,
    GetUsersResponse,
    ModifyChannelInformationRequestConfigBuilder,
    ModifyChannelInformationResponse,
    SendChatMessageRequestConfigBuilder,
    SendChatMessageResponse,
    SnoozeNextAdRequestConfigBuilder,
    SnoozeNextAdResponse,
    StartCommercialRequestConfigBuilder,
    StartCommercialResponse
} from './src/builders/api/index';

// ==========================
//     Command Interfaces
// ==========================
import {  
    ChatCommandExecutionGuard,
    ChatCommandExecutionGuardAvaliableResults,
    ChatCommandExecutionGuardBlockResult,
    ChatCommandExecutionGuardPassResult,
    ChatCommandPreExecution,
    ChatCommandExecution, 
    ChatCommandPostExecution
} from './src/types/ChatCommand.types';

// ==========================
//     Example Commands
// ==========================
import PingCommand from './src/example/commands/Ping.command';
import ExampleCommand from './src/example/commands/Example.command';

// ==========================
//     Listener Interfaces
// ==========================
import { 
    ChatListenerExecution
} from './src/types/ChatListener.types';

// ==========================
//     Example Listeners
// ==========================
import CounterListener from './src/example/listeners/Counter.listener';
import ShowMessageListener from './src/example/listeners/ShowMessage.listener';

// ==========================
//     Decorator Types
// ==========================

import { ChatCommand } from './src/decorators/ChatCommand.decorator';
import { ChatListener } from './src/decorators/ChatListener.decorator';

import {
    Raw, 
    SenderData, Sender, 
    MessageUser,
    BroadcasterData, Broadcaster,
    MessageData, Mess,
    OptionsProvider, ChannelOptions
} from './src/decorators/ChatData.decorators';

// ==============================
//   Chat Data Injector Objects
// ==============================

import { PartialTwitchUser, TwitchUser, ChatterUser } from './src/objects/TwitchUser.object';
import { ChatMessage, TwitchChatMessage } from './src/objects/ChatMessage.object';

// ==========================
//   Chat Data Types
// ==========================

import { BadgeSetId, Badge, TwitchUserBroadcasterType, TwitchUserType, ITwitchUser, IBroadcasterUser, IChatterUser, IPartialTwitchUser } from './src/types/twitch/TwitchUser.types';
import { IChatMessage, Message, MessageFragment, MessageFramgentType, Cheermote, Emote, Mention, MessageType, Cheer, Reply } from './src/types/twitch/ChatMessage.types';

// ==========================
//   Token Repository Types
// ==========================

import { ITokenRepositoryProvider } from './src/types/Token.repository.types';

// ==========================
//   Predefined Strategies
// ==========================

import InMemoryTokenRepository from './src/example/repositories/InMemoryToken.repository';

// =================================
//   Listen Channel Provider Types
// =================================

import { IListenChannelsProvider } from './src/types/ListenChannels.provider.types';

// ==================================
//   Channel Options Provider Types
// ==================================

import { IChannelOptionsProvider, TChannelOptions } from './src/types/ChannelOptions.provider';
import { ChannelOptionsProvider } from './src/providers/ChannelOptions.provider';

// ============================
//   Main TwitchBot Decorator
// ============================

import { TwitchBot } from './src/decorators/TwitchBot.decorator';
import { LogLevel } from './src/utils/Logger';
import { ITwitchBotOptions } from './src/decorators/TwitchBot.decorator';

// ============================
//   Module Types
// ============================

import { IModuleDefinition } from './src/types/Module.types';
import CommandsModule from './src/modules/Commands.module';
import ListenersModule from './src/modules/Listeners.module';
import APIRateLimiterModule from './src/modules/APIRateLimiter.module';
import ChatBotModule from './src/modules/ChatBot.module';
import CacheModule from './src/modules/Cache.module';
import { 
    APIRateLimiterModuleForRootConfig, APIRateLimiterModuleForFeatureConfig, 
    CommandsModuleForRootConfig, CommandsModuleForFeatureConfig, 
    ListenersModuleForRootConfig, ListenersModuleForFeatureConfig,
    ChatBotModuleForRootConfig, ChatBotModuleForFeatureConfig,
    CacheModuleForRootConfig, CacheModuleForFeatureConfig
} from './src/types/Module.types';

// ============================
//   Exports
// ============================

export {
    // API Request Config Builders
    Builders,
    GetAdScheduleRequestConfigBuilder,
    GetAdScheduleResponse,
    GetChannelEditorsRequestConfigBuilder,
    GetChannelEditorsResponse,
    GetChannelInformationRequestConfigBuilder,
    GetChannelInformationResponse,
    GetCheermotesRequestConfigBuilder,
    GetCheermotesResponse,
    GetExtensionAnalyticsRequestConfigBuilder,
    GetExtensionAnalyticsResponse,
    GetExtensionTransactionsRequestConfigBuilder,
    GetExtensionTransactionsResponse,
    GetGameAnalyticsRequestConfigBuilder,
    GetGameAnalyticsResponse,
    GetUsersRequestBuilder,
    GetUsersResponse,
    ModifyChannelInformationRequestConfigBuilder,
    ModifyChannelInformationResponse,
    SendChatMessageRequestConfigBuilder,
    SendChatMessageResponse,
    SnoozeNextAdRequestConfigBuilder,
    SnoozeNextAdResponse,
    StartCommercialRequestConfigBuilder,
    StartCommercialResponse,

    // Command Interfaces
    ChatCommandExecutionGuard,
    ChatCommandExecutionGuardAvaliableResults,
    ChatCommandExecutionGuardBlockResult,
    ChatCommandExecutionGuardPassResult,
    ChatCommandPreExecution,
    ChatCommandExecution, 
    ChatCommandPostExecution,

    // Example Commands
    PingCommand,
    ExampleCommand,

    // Listener Interfaces
    ChatListenerExecution,

    // Example Listeners
    CounterListener,
    ShowMessageListener,

    // Decorator Types
    ChatCommand,
    ChatListener,

    Raw, 
    SenderData, Sender, 
    MessageUser,
    BroadcasterData, Broadcaster,
    MessageData, Mess,
    OptionsProvider, ChannelOptions,

    // Chat Data Injector Objects
    PartialTwitchUser, TwitchUser, ChatterUser,
    ChatMessage, TwitchChatMessage,

    // Chat Data Types
    BadgeSetId, Badge, TwitchUserBroadcasterType, TwitchUserType, ITwitchUser, IBroadcasterUser, IChatterUser, IPartialTwitchUser,
    IChatMessage, Message, MessageFragment, MessageFramgentType, Cheermote, Emote, Mention, MessageType, Cheer, Reply,

    // Token Repository Types
    ITokenRepositoryProvider,

    // Predefined Strategies
    InMemoryTokenRepository,

    // Listen Channel Provider Types
    IListenChannelsProvider,

    // Channel Options Provider Types
    IChannelOptionsProvider, TChannelOptions, ChannelOptionsProvider,

    // Main TwitchBot Decorator
    TwitchBot, ITwitchBotOptions, LogLevel,

    // Module Types
    IModuleDefinition,
    ChatBotModule, ChatBotModuleForRootConfig, ChatBotModuleForFeatureConfig,
    CommandsModule, CommandsModuleForRootConfig, CommandsModuleForFeatureConfig,
    ListenersModule, ListenersModuleForRootConfig, ListenersModuleForFeatureConfig,
    APIRateLimiterModule, APIRateLimiterModuleForRootConfig, APIRateLimiterModuleForFeatureConfig,
    CacheModule, CacheModuleForRootConfig, CacheModuleForFeatureConfig,
}