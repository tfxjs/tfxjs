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
    return {
        __esModule: true, // This line ensures the module is treated as an ES module
        default: originalModule.default
    };
});

jest.mock('axios');
jest.mock('../../src/builders/Make.Axios.request');
jest.mock('../../src/builders/Make.RateLimiter.request');

import MakeRequest from '../../src/builders/Make.request';
import BaseRequestBuilder from '../../src/builders/api/Base.request.builder';
import { UsableToken } from '../../src/types/Token.repository.types';
import { Container } from '@inversifyjs/container';
import MakeRequestWithAxios from '../../src/builders/Make.Axios.request';
import MakeRequestWithAPIRateLimiter from '../../src/builders/Make.RateLimiter.request';
import { AxiosResponse } from 'axios';

describe('MakeRequest', () => {
    let requestBuilder: BaseRequestBuilder;
    let makeAxiosRequestMock = MakeRequestWithAxios as jest.MockedFunction<typeof MakeRequestWithAxios>;
    let makeRequestWithAPIRateLimiterMock = MakeRequestWithAPIRateLimiter as jest.MockedFunction<typeof MakeRequestWithAPIRateLimiter>;

    beforeEach(() => {
        requestBuilder = {
            build: jest.fn().mockReturnValue({ method: 'GET', url: 'http://example.com' } as any),
            getUsedToken: jest.fn()
        } as unknown as BaseRequestBuilder;
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should fail if no token is found', async () => {
        jest.spyOn(requestBuilder, 'getUsedToken').mockReturnValue(null);
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
            const response = { status: 200, data: 'response' };
            makeAxiosRequestMock.mockResolvedValue(response as AxiosResponse);

            const request = await MakeRequest(requestBuilder);
            expect(request).toBe(response.data);
        });

        it('should fail if request fails', async () => {
            makeAxiosRequestMock.mockRejectedValue(new Error('Request failed'));
            jest.spyOn(requestBuilder, 'getUsedToken').mockReturnValue({} as UsableToken);
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
            makeRequestWithAPIRateLimiterMock.mockResolvedValue(response as AxiosResponse);

            const request = await MakeRequest(requestBuilder);
            expect(request).toBe(response.data);
        });

        it('should fail if request fails', async () => {
            const error = { response: { status: 500, data: { message: 'Request failed' } } };
            makeRequestWithAPIRateLimiterMock.mockRejectedValue(error);

            await expect(MakeRequest(requestBuilder)).rejects.toThrow();
        });
    });
});
