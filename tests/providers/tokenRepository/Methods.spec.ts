import { loggerMock } from '../../mocks/Logger.mock';

jest.mock('../../../src/utils/Logger', () => ({
    LoggerFactory: {
        createLogger: jest.fn(() => loggerMock),
    },
}));

import { Container } from '@inversifyjs/container';
import TokenRepositoryProvider from '../../../src/providers/Token.repository.provider';
import { AppToken, ITokenRepositoryProvider, UserToken } from '../../../src/types/Token.repository.types';
import DINames from '../../../src/utils/DI.names';
import TwtichPermissionScope from '../../../src/enums/TwitchPermissionScope.enum';

describe('TokenRepositoryProvider: Methods', () => {
    let tokenRepositoryProvider: TokenRepositoryProvider;
    let tokenRepository: ITokenRepositoryProvider;

    const appToken: AppToken = {
        access_token: 'app-token',
        expires_in: 13523523,
        savedAt: 124,
    };

    const userToken: UserToken = {
        access_token: 'user-token',
        refresh_token: 'refresh-token',
        expires_in: 13523523,
        savedAt: 124,
        scope: [
            TwtichPermissionScope.UserBot, 
            TwtichPermissionScope.ChannelBot,
            TwtichPermissionScope.UserReadChat,
            TwtichPermissionScope.UserWriteChat
        ],
    };

    const userId = 'testUserId';

    beforeEach(() => {
        tokenRepository = {
            getAppToken: jest.fn().mockResolvedValue(appToken),
            saveAppToken: jest.fn().mockResolvedValue(undefined),
            getUserAccessToken: jest.fn().mockResolvedValue(userToken),
            saveUserAccessToken: jest.fn().mockResolvedValue(undefined),
            removeUserAccessToken: jest.fn().mockResolvedValue(undefined),
            getUserRefreshToken: jest.fn().mockResolvedValue('refresh-token'),
            removeUserRefreshToken: jest.fn().mockResolvedValue(undefined),
        } as unknown as ITokenRepositoryProvider;

        jest.spyOn(Container.prototype, 'get').mockImplementation((id: any) => {
            if (id === DINames.UserDefinedTokenRepositoryProvider) return tokenRepository;
            return null;
        });

        tokenRepositoryProvider = new TokenRepositoryProvider();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Method: getAppToken', () => {
        it('should get app token from the repository', async () => {
            const result = await tokenRepositoryProvider.getAppToken();
            expect(tokenRepository.getAppToken).toHaveBeenCalled();
            expect(result).toEqual(appToken);
        });
    });

    describe('Method: saveAppToken', () => {
        it('should save app token using the repository', async () => {
            await tokenRepositoryProvider.saveAppToken(appToken);
            expect(tokenRepository.saveAppToken).toHaveBeenCalledWith(appToken);
        });
    });

    describe('Method: getUserAccessToken', () => {
        it('should get user access token from the repository', async () => {
            const result = await tokenRepositoryProvider.getUserAccessToken(userId);
            expect(tokenRepository.getUserAccessToken).toHaveBeenCalledWith(userId);
            expect(result).toEqual(userToken);
        });
    });

    describe('Method: saveUserAccessToken', () => {
        it('should save user access token using the repository', async () => {
            await tokenRepositoryProvider.saveUserAccessToken(userId, userToken);
            expect(tokenRepository.saveUserAccessToken).toHaveBeenCalledWith(userId, userToken);
        });
    });

    describe('Method: removeUserAccessToken', () => {
        it('should remove user access token using the repository', async () => {
            await tokenRepositoryProvider.removeUserAccessToken(userId);
            expect(tokenRepository.removeUserAccessToken).toHaveBeenCalledWith(userId);
        });
    });

    describe('Method: getUserRefreshToken', () => {
        it('should get user refresh token from the repository', async () => {
            const result = await tokenRepositoryProvider.getUserRefreshToken(userId);
            expect(tokenRepository.getUserRefreshToken).toHaveBeenCalledWith(userId);
            expect(result).toEqual('refresh-token');
        });
    });

    describe('Method: removeUserRefreshToken', () => {
        it('should remove user refresh token using the repository', async () => {
            await tokenRepositoryProvider.removeUserRefreshToken(userId);
            expect(tokenRepository.removeUserRefreshToken).toHaveBeenCalledWith(userId);
        });
    });
});