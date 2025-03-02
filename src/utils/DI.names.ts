enum DINames {
    // Config
    ConfigService = 'CONFIG_SERVICE',

    // Logs
    LoggerFactory = 'LOGGER_FACTORY',

    // Services & Clients
    TokenService = 'TOKEN_SERVICE',
    RateLimiterService = 'RATE_LIMITER_SERVICE',
    EventSubClient = 'EVENT_SUB_CLIENT',
    APIClient = 'API_CLIENT',
    WebsocketClient = 'WEBSOCKET_CLIENT',

    // Providers
    ListenChannelsProvider = 'LISTEN_CHANNELS_PROVIDER',
    ChannelOptionsProvider = 'CHANNEL_OPTIONS_PROVIDER',
    TokenRepositoryProvider = 'TOKEN_REPOSITORY_PROVIDER',

    // User-defined
    UserDefinedListenChannelsProvider = 'USER_DEFINED_LISTEN_CHANNELS_PROVIDER',
    UserDefinedChannelOptionsProvider = 'USER_DEFINED_CHANNEL_OPTIONS_PROVIDER',
    UserDefinedTokenRepositoryProvider = 'USER_DEFINED_TOKEN_REPOSITORY_PROVIDER',

    // Commands & Listeners
    Commands = 'COMMANDS',
    Listeners = 'LISTENERS',

    // Chat 
    ChatCommandsService = 'CHAT_COMMANDS_SERVICE',
    ChatListenersService = 'CHAT_LISTENERS_SERVICE',
    ChatDataInjectorService = 'CHAT_DATA_INJECTOR_SERVICE',

    // Cache-fetchers
    TwitchUserCacheFetchStrategy = 'TWITCH_USER_CACHE_FETCH_STRATEGY',

    // Cache
    TwitchUserCache = 'TWITCH_USER_CACHE',
}

export default DINames;