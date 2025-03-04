import FulfillRequest from '../../src/builders/Fulfill.request';
import { DIContainer } from '../../src/di/Container';
import DINames from '../../src/utils/DI.names';
import ConfigService from '../../src/services/Config.service';
import {TokenService} from '../../src/services/Token.service';
import BaseRequestBuilder from '../../src/builders/api/Base.request.builder';
import { UsableAppToken, UsableUserToken } from '../../src/types/Token.repository.types';

describe('FulfillRequest', () => {
    let configService: ConfigService;
    let tokenService: TokenService;
    let requestBuilder: BaseRequestBuilder;

    const clientId = 'clientId';
    const userId = 'userId';
    const appToken : UsableAppToken = { token: 'appToken' } as UsableAppToken;
    const userToken : UsableUserToken = { token: 'userToken' } as UsableUserToken;

    beforeEach(() => {
        configService = {
            getClientId: jest.fn().mockReturnValue(clientId),
        } as unknown as ConfigService;

        tokenService = {
            getAppToken: jest.fn().mockResolvedValue(appToken),
            getUserTokenById: jest.fn().mockResolvedValue(userToken),
        } as unknown as TokenService;

        requestBuilder = {
            setClientId: jest.fn(),
            getUserIdRelatedToToken: jest.fn().mockReturnValue(userId),
            setAccessToken: jest.fn(),
        } as unknown as BaseRequestBuilder;

        jest.spyOn(DIContainer, 'get').mockImplementation((id: any) => {
            if (id === DINames.ConfigService) return configService;
            if (id === DINames.TokenService) return tokenService;
            return null;
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    // App Token (userId related to token is empty)
    it('should set client ID and app access token if user ID is empty', async () => {
        jest.spyOn(requestBuilder, 'getUserIdRelatedToToken').mockReturnValue('');

        await FulfillRequest(requestBuilder);

        expect(requestBuilder.setClientId).toHaveBeenCalledWith(clientId);
        expect(tokenService.getAppToken).toHaveBeenCalled();
        expect(requestBuilder.setAccessToken).toHaveBeenCalledWith(appToken);
    });

    // App Token (userId related to token is empty) + Forbid to use app token
    it('should not set app access token if user ID is empty and useAppTokenIfNull is false', async () => {
        jest.spyOn(requestBuilder, 'getUserIdRelatedToToken').mockReturnValue('');

        await FulfillRequest(requestBuilder, false);

        expect(requestBuilder.setClientId).toHaveBeenCalledWith(clientId);
        expect(tokenService.getAppToken).not.toHaveBeenCalled();
        expect(requestBuilder.setAccessToken).not.toHaveBeenCalled();
    });

    // User Token (userId related to token is not empty)
    it('should set client ID and user access token if user ID is not empty', async () => {
        jest.spyOn(requestBuilder, 'getUserIdRelatedToToken').mockReturnValue(userId);
        await FulfillRequest(requestBuilder);

        expect(requestBuilder.setClientId).toHaveBeenCalledWith(clientId);
        expect(tokenService.getUserTokenById).toHaveBeenCalledWith(userId);
        expect(requestBuilder.setAccessToken).toHaveBeenCalledWith(userToken);
    });

    it('should throw an error if user token is null', async () => {
        jest.spyOn(requestBuilder, 'getUserIdRelatedToToken').mockReturnValue(userId);
        jest.spyOn(tokenService, 'getUserTokenById').mockResolvedValue(null);

        await expect(FulfillRequest(requestBuilder)).rejects.toThrow();
    });
});
