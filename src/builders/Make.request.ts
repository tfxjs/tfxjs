import axios, { AxiosError, AxiosResponse } from 'axios';
import { LoggerFactory } from '../utils/Logger';
import BaseRequestBuilder from './api/Base.request.builder';
import DINames from '../utils/DI.names';
import RateLimiterService from '../services/RateLimiter.service';
import { RequestPriority } from '../types/RateLimiter.types';
import { DIContainer } from '../di/Container';
import MakeRequestWithAPIRateLimiter from './Make.RateLimiter.request';
import MakeRequestWithAxios from './Make.Axios.request';

let counter = 0;

/**
 * Make request
 * @param requestBuilder Request builder
 * @param priority Request priority
 * @returns Promise<T> if request was successful
 * @throws Error if request failed (HTTP status code is not 2xx)
 * @throws Error if request failed (Axios error)
 * @throws Error if request failed (No token found)
 */
export default async function MakeRequest<T>(requestBuilder: BaseRequestBuilder, priority: RequestPriority = RequestPriority.Medium): Promise<T> {
    const requestConfig = requestBuilder.build();

    const logger = LoggerFactory.createLogger(`MakeRequest:${counter++}`);
    logger.debug(`Making request to ${requestConfig.method} ${requestConfig.url}`);

    const usedToken = requestBuilder.getUsedToken();
    if (usedToken === null) {
        const errorMessage = 'You need to fulfill request before making it (No token found)';
        logger.error(errorMessage);
        throw new Error(errorMessage);
    }

    let response: Promise<AxiosResponse<T>> | null = null;

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
            if(error instanceof AxiosError) {
                logger.error(`Error while making request [${error.response?.status || "Unknown code"}]: ${error.response?.data.message || "No message"}`);
                throw error;
            }

            if(!(error instanceof Error)) {
                logger.error(`Error while making request: ${error}`);
                throw new Error('Unknown error');
            }

            logger.error(`Error while making request: ${error.message}`);
            throw error;
        });
}