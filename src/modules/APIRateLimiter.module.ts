import RateLimiterService from '../services/RateLimiter.service';
import { IModuleDefinition } from '../types/Module.types';
import DINames from '../utils/DI.names';

export type APIRateLimiterModuleConfig = {}

export default class APIRateLimiterModule {
    static forRoot(config: APIRateLimiterModuleConfig = {}): IModuleDefinition {
        return {
            module: APIRateLimiterModule,
            providers: [
                { token: DINames.RateLimiterService, useClass: RateLimiterService }
            ]
        };
    }
}