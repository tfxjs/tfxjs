import TwitchUserCacheFetchStrategy from "../cache/fetchers/TwitchUser.cache.fetch.strategy";
import TwitchUserCache from "../cache/TwitchUser.cache";
import { ClassOrValue, IModuleDefinition } from "../types/Module.types";
import DINames from "../utils/DI.names";


export type CacheModuleConfig = {}

export default class CacheModule {
    static forRoot(config: CacheModuleConfig = {}): IModuleDefinition {
        return {
            module: CacheModule,
            providers: [
                { token: DINames.TwitchUserCacheFetchStrategy, useClass: TwitchUserCacheFetchStrategy },
                { token: DINames.TwitchUserCache, useClass: TwitchUserCache },
            ]
        };
    }
}