import { loggerMock } from '../mocks/Logger.mock';

jest.mock('../../src/utils/Logger', () => {
    return {
        LoggerFactory: {
            createLogger: jest.fn(() => loggerMock),
        },
    };
});

jest.mock('../../src/builders/Make.request', () => {
    const originalModule = jest.requireActual('../../src/builders/Make.request');
    console.warn(originalModule);

    return {
        __esModule: true, // This line ensures the module is treated as an ES module
        ...originalModule,
        MakeRequestWithAxios: jest.fn(),
        MakeRequestWithAPIRateLimiter: jest.fn(),
        default: originalModule.default
    };
});

jest.mock('axios');

import MakeRequest, { MakeRequestWithAxios, MakeRequestWithAPIRateLimiter } from '../../src/builders/Make.request';
import BaseRequestBuilder from '../../src/builders/api/Base.request.builder';
import { UsableAppToken, UsableUserToken } from '../../src/types/Token.repository.types';
import { Container } from '@inversifyjs/container';
import DINames from '../../src/utils/DI.names';
import RateLimiterService from '../../src/services/RateLimiter.service';

describe('MakeRequest', () => {
    let requestBuilder: BaseRequestBuilder;

    const requestConfig = {
        method: 'GET',
        url: 'https://api.example.com',
    };

    const appToken : UsableAppToken = { token: 'appToken', isApp: true };
    const userToken : UsableUserToken = { token: 'userToken', isApp: false, userId: 'userId' };

    beforeEach(() => {
        requestBuilder = {
            build: jest.fn().mockReturnValue(requestConfig),
            getUsedToken: jest.fn().mockReturnValue(userToken),
        } as unknown as BaseRequestBuilder;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fail if no token is found', async () => {
        requestBuilder.getUsedToken = jest.fn().mockReturnValue(null);

        await expect(MakeRequest(requestBuilder)).rejects.toThrow();
    });

    describe('with axios', () => {
        beforeEach(() => {
            jest.spyOn(Container.prototype, 'isBound').mockReturnValue(false);
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should make request with axios', async () => {
            const data = { data: 'response' };
            (MakeRequestWithAxios as jest.Mock).mockResolvedValue({ status: 200, data });

            const response = await MakeRequest(requestBuilder);
            expect(response).toBe(data);
        });

        it('should fail if request fails', async () => {
            const error = new Error('Request failed');
            (MakeRequestWithAxios as jest.Mock).mockRejectedValue(error);

            await expect(MakeRequest(requestBuilder)).rejects.toThrow();
        });
    });

    describe('with rate limiter', () => {
        beforeEach(() => {
            jest.spyOn(Container.prototype, 'isBound').mockReturnValue(true);
        });

        afterEach(() => {
            jest.clearAllMocks();
        });    

        it('should make request with rate limiter', async () => {
            const response = { status: 200, data: 'response' };
            (MakeRequestWithAPIRateLimiter as jest.Mock).mockResolvedValue(response);

            const request = await MakeRequest(requestBuilder);
            expect(request).toBe(response.data);
        });

        it('should fail if request fails', async () => {
            const error = { response: { status: 500, data: { message: 'Request failed' } } };
            (MakeRequestWithAPIRateLimiter as jest.Mock).mockRejectedValue(error);

            await expect(MakeRequest(requestBuilder)).rejects.toThrow();
        });
    });
});
