import axios, { AxiosResponse } from 'axios';
import { Logger } from '../utils/Logger';
import BaseRequestBuilder from './api/Base.request.builder';
import DINames from '../utils/DI.names';
import RateLimiterService from '../services/RateLimiter.service';
import { RequestPriority } from '../types/RateLimiter.types';
import { DIContainer } from '../di/Container';

let counter = 0;

export default async function MakeRequest<T>(requestBuilder: BaseRequestBuilder, priority: RequestPriority = RequestPriority.Medium): Promise<T> {
    const requestConfig = requestBuilder.build();

    const logger = new Logger(`MakeRequest:${counter++}`);
    logger.debug(`Making request to ${requestConfig.method} ${requestConfig.url}`);

    const usedToken = requestBuilder.getUsedToken();
    if (usedToken === null) {
        const errorMessage = 'You need to fulfill request before making it (No token found)';
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }

    let response: Promise<AxiosResponse> | null = null;

    // if APIRateLimiter is configured
    if (DIContainer.isBound(DINames.RateLimiterService)) {
        response = MakeRequestWithAPIRateLimiter<T>(requestConfig, usedToken, priority);
    }

    // if APIRateLimiter is not configured
    else {
        response = MakeRequestWithAxios<T>(requestConfig);
    }

    return response
        .then((response) => {
            logger.debug(`Successfully received response [${response.status}]`);
            return response.data;
        })
        .catch((error) => {
            const errorMessage = `Error while making request [${error.response.status}]: ${error.response.data.message}`;
            logger.error(errorMessage);
            throw new Error(errorMessage);
        });
}

export async function MakeRequestWithAxios<T>(requestConfig: any): Promise<AxiosResponse> {
    return await axios.request(requestConfig)
}

export async function MakeRequestWithAPIRateLimiter<T>(requestConfig: any, usedToken: any, priority: RequestPriority = RequestPriority.Medium): Promise<AxiosResponse> {
    const ratelimiter = DIContainer.get(DINames.RateLimiterService) as RateLimiterService;
    const individualRateLimiter = usedToken.isApp ? ratelimiter.forApp() : ratelimiter.forUser(usedToken.userId);
    return individualRateLimiter.send<T>(requestConfig, priority);
}