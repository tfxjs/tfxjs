import TwitchUserCacheFetchStrategy from "../cache/fetchers/TwitchUser.cache.fetch.strategy";
import TwitchUserCache from "../cache/TwitchUser.cache";
import { CacheModuleForFeatureConfig, IModuleDefinition } from "../types/Module.types";
import DINames from "../utils/DI.names";

export default class CacheModule {
    static forRoot(config: CacheModuleForFeatureConfig = {}): IModuleDefinition {
        return {
            module: CacheModule,
            providers: [
                { token: DINames.TwitchUserCacheFetchStrategy, useClass: TwitchUserCacheFetchStrategy },
                { token: DINames.TwitchUserCache, useClass: TwitchUserCache },
            ]
        };
    }
}