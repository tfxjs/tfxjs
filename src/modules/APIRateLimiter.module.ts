import RateLimiterService from '../services/RateLimiter.service';
import { APIRateLimiterModuleForRootConfig, IModuleDefinition } from '../types/Module.types';
import DINames from '../utils/DI.names';

export default class APIRateLimiterModule {
    static forRoot(config: APIRateLimiterModuleForRootConfig = {}): IModuleDefinition {
        return {
            module: APIRateLimiterModule,
            providers: [
                { token: DINames.RateLimiterService, useClass: RateLimiterService }
            ]
        };
    }
}