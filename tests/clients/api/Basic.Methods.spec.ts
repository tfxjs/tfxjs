import { loggerMock } from '../../mocks/Logger.mock'
import { DIContainer } from '../../../src/di/Container';
import DINames from '../../../src/utils/DI.names';
import APIClient from '../../../src/clients/Api.client';
import { TokenService } from '../../../src/services/Token.service';
import { UsableAppToken, UsableUserToken } from '../../../src/types/Token.repository.types';
import ConfigService from '../../../src/services/Config.service';
import { Container } from '@inversifyjs/container';

jest.mock('../../../src/utils/Logger', () => {
    const originalModule = jest.requireActual('../../../src/utils/Logger');
    return {
        ...originalModule,
        LoggerFactory: {
            createLogger: jest.fn(() => loggerMock),
        },
    };
});

describe('APIClient: Basic Methods', () => {
    let apiClient: APIClient;
    let tokenService: TokenService;
    let configService: ConfigService;

    const userId = 'userId';
    const appToken : UsableAppToken = { token: 'appToken' } as any;
    const userToken : UsableUserToken = { token: 'userToken' } as any;

    beforeEach(() => {
        configService = {
            getUserId: jest.fn().mockReturnValue(userId),
        } as unknown as ConfigService;

        tokenService = {
            getAppToken: jest.fn().mockResolvedValue(appToken),
            getUserTokenById: jest.fn().mockResolvedValue(userToken),
        } as unknown as TokenService;

        jest.spyOn(Container.prototype, 'get').mockImplementation((id: any) => {
            if (id === DINames.ConfigService) return configService;
            if (id === DINames.TokenService) return tokenService;
            return null;
        });

        apiClient = new APIClient();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });
    
    describe('Method: getAppAccessToken', () => {
        it('should return app token', async () => {
            const result = await apiClient['getAppAccessToken']();
            expect(result).toEqual(appToken);
            expect(tokenService.getAppToken).toHaveBeenCalledTimes(1);
        });
    });

    describe('Method: getUserAccessToken', () => {
        it('should return user token', async () => {
            const result = await apiClient['getUserAccessToken']();
            expect(result).toEqual(userToken);
            expect(tokenService.getUserTokenById).toHaveBeenCalledTimes(1);
            expect(tokenService.getUserTokenById).toHaveBeenCalledWith(userId);
        });

        it('should throw an error if user token is null', async () => {
            jest.spyOn(tokenService, 'getUserTokenById').mockResolvedValue(null);
            await expect(apiClient['getUserAccessToken']()).rejects.toThrow();
        });
    });

});
