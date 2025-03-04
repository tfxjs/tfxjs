import { loggerMock } from '../../mocks/Logger.mock'
import { DIContainer } from '../../../src/di/Container';
import DINames from '../../../src/utils/DI.names';
import ConfigService from '../../../src/services/Config.service';
import APIClient from '../../../src/clients/Api.client';
import GetUsersRequestBuilder from '../../../src/builders/api/GetUsers.request.builder';
import MakeRequest from '../../../src/builders/Make.request';
import FulfillRequest from '../../../src/builders/Fulfill.request';
import { TokenService } from '../../../src/services/Token.service';
import { UsableAppToken, UsableUserToken } from '../../../src/types/Token.repository.types';
import { Container } from '@inversifyjs/container';

jest.mock('../../../src/utils/Logger', () => {
    return {
        LoggerFactory: {
            createLogger: jest.fn(() => loggerMock),
        },
    };
});

jest.mock('../../../src/builders/Make.request');
jest.mock('../../../src/builders/Fulfill.request');

describe('APIClient', () => {
    let apiClient: APIClient;
    let configService: ConfigService;
    let tokenService: TokenService;

    const clientId = 'clientId';
    const userId = 'userId';
    const appToken : UsableAppToken = { token: 'appToken' } as any;
    const userToken : UsableUserToken = { token: 'userToken' } as any;

    beforeEach(() => {
        configService = {
            getClientId: jest.fn().mockReturnValue(clientId),
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

    describe('getUsers', () => {
        it('should return user data', async () => {
            const params = { ids: ['id1'], logins: ['login1'] };
            const responseData = { data: [{ id: 'id1', login: 'login1' }] };
            (FulfillRequest as jest.Mock).mockResolvedValueOnce({});
            (MakeRequest as jest.Mock).mockResolvedValueOnce(responseData);

            const result = await apiClient.getUsers(params);

            expect(FulfillRequest).toHaveBeenCalledWith(expect.any(GetUsersRequestBuilder));
            expect(MakeRequest).toHaveBeenCalledWith(expect.any(Object));
            expect(result).toEqual(responseData.data);
        });
    });

    describe('getUserById', () => {
        it('should return user data by id', async () => {
            const id = 'id1';
            const responseData = { data: [{ id: 'id1', login: 'login1' }] };
            (FulfillRequest as jest.Mock).mockResolvedValueOnce({});
            (MakeRequest as jest.Mock).mockResolvedValueOnce(responseData);

            const result = await apiClient.getUserById(id);

            expect(result).toEqual(responseData.data[0]);
        });

        it('should throw an error if user not found', async () => {
            const id = 'id1';
            const responseData = { data: [] };
            (FulfillRequest as jest.Mock).mockResolvedValueOnce({});
            (MakeRequest as jest.Mock).mockResolvedValueOnce(responseData);

            await expect(apiClient.getUserById(id)).rejects.toThrow('User not found by id=id1');
        });

        it('should throw an error if multiple users found', async () => {
            const id = 'id1';
            const responseData = { data: [{ id: 'id1', login: 'login1' }, { id: 'id2', login: 'login2' }] };
            (FulfillRequest as jest.Mock).mockResolvedValueOnce({});
            (MakeRequest as jest.Mock).mockResolvedValueOnce(responseData);

            await expect(apiClient.getUserById(id)).rejects.toThrow('Multiple users found by id=id1');
        });
    });

    describe('getUserByLogin', () => {
        it('should return user data by login', async () => {
            const login = 'login1';
            const responseData = { data: [{ id: 'id1', login: 'login1' }] };
            (FulfillRequest as jest.Mock).mockResolvedValueOnce({});
            (MakeRequest as jest.Mock).mockResolvedValueOnce(responseData);

            const result = await apiClient.getUserByLogin(login);

            expect(result).toEqual(responseData.data[0]);
        });

        it('should throw an error if user not found', async () => {
            const login = 'login1';
            const responseData = { data: [] };
            (FulfillRequest as jest.Mock).mockResolvedValueOnce({});
            (MakeRequest as jest.Mock).mockResolvedValueOnce(responseData);

            await expect(apiClient.getUserByLogin(login)).rejects.toThrow('User not found by id=login1');
        });

        it('should throw an error if multiple users found', async () => {
            const login = 'login1';
            const responseData = { data: [{ id: 'id1', login: 'login1' }, { id: 'id2', login: 'login2' }] };
            (FulfillRequest as jest.Mock).mockResolvedValueOnce({});
            (MakeRequest as jest.Mock).mockResolvedValueOnce(responseData);

            await expect(apiClient.getUserByLogin(login)).rejects.toThrow('Multiple users found by id=login1');
        });
    });
});