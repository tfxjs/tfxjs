import { loggerMock } from '../../mocks/Logger.mock';

import { LogLevel, LoggerFactory } from '../../../src/utils/Logger';

jest.mock('../../../src/utils/Logger', () => {
    const originalModule = jest.requireActual('../../../src/utils/Logger');
    return {
        ...originalModule,
        LoggerFactory: {
            createLogger: jest.fn(() => loggerMock),
        },
    };
});

import ConfigService from "../../../src/services/Config.service";

describe('ConfigService: Getters', () => {
    let configService: ConfigService;

    const clientId = 'clientId';
    const clientSecret = 'clientSecret';
    const userId = 'userId';
    const logLevels: LogLevel[] = [LogLevel.WARN, LogLevel.ERROR];

    beforeEach(() => {
        configService = new ConfigService({
            client: {
                id: clientId,
                secret: clientSecret
            },
            userId,
            log: {
                levels: logLevels
            }
        })
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return client id', () => {
        expect(configService.getClientId()).toBe(clientId);
    });

    it('should return client secret', () => {
        expect(configService.getClientSecret()).toBe(clientSecret);
    });

    it('should return user id', () => {
        expect(configService.getUserId()).toBe(userId);
    });

    it('should return log levels', () => {
        // TODO: Dedicated getter for log level 
        expect(configService.getConfig().log.levels).toEqual(logLevels);
    });
});
