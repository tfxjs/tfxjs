import { AppToken, ITokenRepositoryProvider, UserToken } from "../../types/Token.repository.types";
import dotenv from 'dotenv';
import { Logger, LoggerFactory } from "../../utils/Logger";
dotenv.config();

export default class InMemoryTokenRepository implements ITokenRepositoryProvider {
    private logger: Logger;
    private appAccessToken: AppToken | null = null;
    private userAccessTokens: Map<string, UserToken> = new Map();
    private userRefreshTokens: Map<string, string> = new Map();

    constructor(userId: string, userRefreshToken: string) {
        this.logger = LoggerFactory.createLogger('InMemoryTokenRepository');
        if(!userId || !userRefreshToken) {
            const message = 'User ID and refresh token must be provided';
            this.logger.error(message);
            throw new Error(message);
        }
        this.userRefreshTokens.set(userId, userRefreshToken);
        this.logger.info(`Initialized with user ID: ${userId} and refresh token: ${this.logger.censor(userRefreshToken)}`);
    }

    getAppToken(): Promise<AppToken | null> {
        return Promise.resolve(this.appAccessToken);
    }

    saveAppToken(token: AppToken): Promise<void> {
        this.appAccessToken = token;
        return Promise.resolve();
    }

    getUserAccessToken(userId: string): Promise<UserToken | null> {
        return Promise.resolve(this.userAccessTokens.get(userId) || null);
    }

    saveUserAccessToken(userId: string, token: UserToken): Promise<void> {
        this.userAccessTokens.set(userId, token);
        return Promise.resolve();
    }

    removeUserAccessToken(userId: string): Promise<void> {
        this.userAccessTokens.delete(userId);
        return Promise.resolve();
    }

    getUserRefreshToken(userId: string): Promise<string | null> {
        return Promise.resolve(this.userRefreshTokens.get(userId) || null);
    }

    removeUserRefreshToken(userId: string): Promise<void> {
        this.userRefreshTokens.delete(userId);
        return Promise.resolve();
    }
}