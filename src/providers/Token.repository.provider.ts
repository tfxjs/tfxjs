import { DIContainer } from "../di/Container";
import { AppToken, ITokenRepositoryProvider, UserToken } from "../types/Token.repository.types";
import DINames from "../utils/DI.names";
import { Logger, LoggerFactory } from "../utils/Logger";

export default class TokenRepositoryProvider implements ITokenRepositoryProvider {
    private tokenRepository: ITokenRepositoryProvider

    private logger: Logger;

    constructor() {
        this.logger = LoggerFactory.createLogger('TokenRepositoryProvider');

        this.tokenRepository = DIContainer.get<ITokenRepositoryProvider>(DINames.UserDefinedTokenRepositoryProvider);

        this.logger.debug(`Initialized`);
    }

    // App / Client
    getAppToken(): Promise<AppToken | null> {
        return this.tokenRepository.getAppToken();
    }

    saveAppToken(token: AppToken): Promise<void> {
        return this.tokenRepository.saveAppToken(token);
    }

    // User - Access
    getUserAccessToken(userId: string): Promise<UserToken | null> {
        return this.tokenRepository.getUserAccessToken(userId);
    }

    saveUserAccessToken(userId: string, token: UserToken): Promise<void> {
        return this.tokenRepository.saveUserAccessToken(userId, token);
    }

    removeUserAccessToken(userId: string): Promise<void> {
        return this.tokenRepository.removeUserAccessToken(userId);
    }

    // User - Refresh
    getUserRefreshToken(userId: string): Promise<string | null> {
        return this.tokenRepository.getUserRefreshToken(userId);
    }
    
    removeUserRefreshToken(userId: string): Promise<void> {
        return this.tokenRepository.removeUserRefreshToken(userId);
    }
}