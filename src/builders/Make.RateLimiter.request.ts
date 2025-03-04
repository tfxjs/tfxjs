import { AxiosRequestConfig, AxiosResponse } from 'axios';
import DINames from '../utils/DI.names';
import RateLimiterService from '../services/RateLimiter.service';
import { RequestPriority } from '../types/RateLimiter.types';
import { DIContainer } from '../di/Container';
import { UsableToken } from '../types/Token.repository.types';

export default async function MakeRequestWithAPIRateLimiter<T>(requestConfig: AxiosRequestConfig, usedToken: UsableToken, priority: RequestPriority = RequestPriority.Medium): Promise<AxiosResponse> {
    const ratelimiter = DIContainer.get(DINames.RateLimiterService) as RateLimiterService;
    const individualRateLimiter = usedToken.isApp ? ratelimiter.forApp() : ratelimiter.forUser(usedToken.userId);
    return individualRateLimiter.send<T>(requestConfig, priority);
}