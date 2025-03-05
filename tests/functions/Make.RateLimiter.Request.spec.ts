import axios, { AxiosRequestConfig } from "axios";
import MakeRequestWithAPIRateLimiter from "../../src/builders/Make.RateLimiter.request";
import { UsableAppToken, UsableUserToken } from "../../src/types/Token.repository.types";
import { Container } from "@inversifyjs/container";
import RateLimiterService from "../../src/services/RateLimiter.service";
import IndividualRateLimiterService from "../../src/services/IndividualRateLimiter.service";

jest.mock('axios');

jest.mock('../../src/builders/Make.RateLimiter.request', () => {
    const originalModule = jest.requireActual('../../src/builders/Make.RateLimiter.request');
    return {
        __esModule: true, // This line ensures the module is treated as an ES module
        default: originalModule.default
    };
});

describe('MakeRequestWithRateLimiter', () => {
    let rateLimiterService: RateLimiterService;
    let individualRateLimiterService: IndividualRateLimiterService;

    const appToken : UsableAppToken = {
        token: 'token',
        isApp: true,
    }

    const userToken : UsableUserToken = {
        token: 'token',
        isApp: false,
        userId: 'userId',
    }

    beforeEach(() => {
        individualRateLimiterService = {
            send: jest.fn(),
        } as unknown as IndividualRateLimiterService;

        rateLimiterService = {
            forApp: jest.fn().mockReturnValue(individualRateLimiterService),
            forUser: jest.fn().mockReturnValue(individualRateLimiterService),
        } as unknown as RateLimiterService;

        jest.spyOn(Container.prototype, 'get').mockReturnValue(rateLimiterService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should resolve a value (appToken used)', async () => {
        const result = { data: {} };
        jest.spyOn(individualRateLimiterService, 'send').mockResolvedValue(result as any);

        await expect(MakeRequestWithAPIRateLimiter({} as AxiosRequestConfig, appToken)).resolves.toEqual(result);

        expect(rateLimiterService.forApp).toHaveBeenCalled();
        expect(rateLimiterService.forUser).not.toHaveBeenCalled();
    });

    it('should resolve a value (userToken used)', async () => {
        const result = { data: {} };
        jest.spyOn(individualRateLimiterService, 'send').mockResolvedValue(result as any);

        await expect(MakeRequestWithAPIRateLimiter({} as AxiosRequestConfig, userToken)).resolves.toEqual(result);

        expect(rateLimiterService.forApp).not.toHaveBeenCalled();
        expect(rateLimiterService.forUser).toHaveBeenCalled();
    });

    it('should reject if send fails', async () => {
        jest.spyOn(individualRateLimiterService, 'send').mockRejectedValue(new Error());

        await expect(MakeRequestWithAPIRateLimiter({} as AxiosRequestConfig, appToken)).rejects.toThrow();
    });

    
});
