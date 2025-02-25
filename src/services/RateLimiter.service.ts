/*

// Normal API
Source: https://dev.twitch.tv/docs/api/guide/

Twitch uses a token-bucket algorithm to ensure the limits are respected. Your app is given a bucket of points. 
Each endpoint is assigned a points value (the default points value per request for an endpoint is 1). 
When your app calls the endpoint, the endpoint’s points value is subtracted from the remaining points in your bucket. 
If your bucket runs out of points within 1 minute, the request returns status code 429.

Your app is given a bucket for app access requests and a bucket for user access requests. 
For requests that specify a user access token, the limits are applied per client ID per user per minute.

If an endpoint uses a non-default points value, or specifies different limit values, the endpoint’s documentation identifies the differences.

The API includes the following headers with each response to help you stay within your request limits.

    Ratelimit-Limit — The rate at which points are added to your bucket.
    Ratelimit-Remaining — The number of points in your bucket.
    Ratelimit-Reset — A Unix epoch timestamp that identifies when your bucket is reset to full.

If you receive HTTP status code 429, use the Ratelimit-Reset header to learn how long you must wait before making another request.

*/


import { Service } from "typedi";
import { Logger, LoggerFactory } from "../utils/Logger";
import IndividualRateLimiterService from "./IndividualRateLimiter.service";
import DINames from "../utils/DI.names";

@Service(DINames.RateLimiterService)
export default class RateLimiterService {
    private readonly logger: Logger;

    constructor() {
        this.logger = LoggerFactory.createLogger('RateLimiterService');
        this.logger.debug('Initialized');
    }

    private instances: Map<string, IndividualRateLimiterService> = new Map();
    forUser(userId: string | 'app') {
        if(!this.instances.has(userId)) this.instances.set(userId, new IndividualRateLimiterService(userId));
        return this.instances.get(userId) as IndividualRateLimiterService;
    }

    forApp() {
        return this.forUser('app');
    }
}