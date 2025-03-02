import { loggerMock } from '../../mocks/Logger.mock';

jest.mock('../../../src/utils/Logger', () => ({
    LoggerFactory: {
        createLogger: jest.fn(() => loggerMock),
    },
}));

jest.mock('../../../src/builders/api/CreateEventSubSubscription.request.builder', () => {
    const mockBuilderInstance = {
        setClientId: jest.fn().mockReturnThis(),
        setAccessToken: jest.fn().mockReturnThis(),
        setType: jest.fn().mockReturnThis(),
        setCondition: jest.fn().mockReturnThis(),
        setVersion: jest.fn().mockReturnThis(),
        setSessionId: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({}),
        correctResponseCodes: [200],
        errorResponseCodes: [400, 401, 403, 409, 429],
    };
    return {
        __esModule: true, // This line ensures the module is treated as an ES module
        default: jest.fn(() => mockBuilderInstance),
    };
});

jest.mock('../../../src/builders/api/DeleteEventSubSubscription.request.builder', () => {
    const mockBuilderInstance = {
        setClientId: jest.fn().mockReturnThis(),
        setAccessToken: jest.fn().mockReturnThis(),
        setId: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({}),
        correctResponseCodes: [204],
        errorResponseCodes: [400, 401, 404],
    };
    return {
        __esModule: true, // This line ensures the module is treated as an ES module
        default: jest.fn(() => mockBuilderInstance),
    };
});

jest.mock('../../../src/builders/api/GetEventSubSubscriptions.request.builder', () => {
    const mockBuilderInstance = {
        setClientId: jest.fn().mockReturnThis(),
        setAccessToken: jest.fn().mockReturnThis(),
        setAfter: jest.fn().mockReturnThis(),
        setUserId: jest.fn().mockReturnThis(),
        setType: jest.fn().mockReturnThis(),
        setStatus: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({}),
        correctResponseCodes: [200],
        errorResponseCodes: [400, 401],
    };
    return {
        __esModule: true, // This line ensures the module is treated as an ES module
        default: jest.fn(() => mockBuilderInstance),
    };
});

import CreateEventSubSubscriptionRequestConfigBuilder from '../../../src/builders/api/CreateEventSubSubscription.request.builder';
import DeleteEventSubSubscriptionRequestConfigBuilder from '../../../src/builders/api/DeleteEventSubSubscription.request.builder';
import GetEventSubSubscriptionsRequestConfigBuilder from '../../../src/builders/api/GetEventSubSubscriptions.request.builder';
import EventSubClient from '../../../src/clients/EventSub.client';
import { UsableUserToken, UsableUserTokenWithScopes } from '../../../src/types/Token.repository.types';
import TwtichPermissionScope from '../../../src/enums/TwitchPermissionScope.enum';
import axios from 'axios';
import ConfigService from '../../../src/services/Config.service';
import { TokenService } from '../../../src/services/Token.service';
import ListenChannelsProvider from '../../../src/providers/ListenChannels.provider';
import WebsocketClient from '../../../src/clients/Websocket.client';
import NotFoundError from '../../../src/errors/NotFound.error';
import TwitchEventId from '../../../src/enums/TwitchEventId.enum';
import { Container } from '@inversifyjs/container';
import DINames from '../../../src/utils/DI.names';

describe('EventSubClient: Basic Methods', () => {
    let eventSubClient: EventSubClient;

    let configService: ConfigService;
    let tokenService: TokenService;
    let listenChannelsProvider: ListenChannelsProvider;
    let websocketClient: WebsocketClient;

    const wsSessionId = 'session-id';
    const clientId = 'clientId';
    const userId = 'userId';
    const userAccessToken: UsableUserToken = {
        token: 'user-access-token',
        isApp: false,
        userId,
    };
    const userAccessTokenWithScopes: UsableUserTokenWithScopes = {
        ...userAccessToken,
        scopes: [TwtichPermissionScope.ChannelBot, TwtichPermissionScope.UserBot],
    };

    beforeEach(() => {
        configService = {
            getClientId: jest.fn().mockReturnValue(clientId),
            getUserId: jest.fn().mockReturnValue(userId),
        } as unknown as ConfigService;

        tokenService = {
            getUserTokenById: jest.fn().mockResolvedValue(userAccessToken),
            getUserTokenWithScopesById: jest.fn().mockResolvedValue(userAccessTokenWithScopes),
        } as unknown as TokenService;

        listenChannelsProvider = {
            refreshChannels: jest.fn(),
            onChannelsUpdated: jest.fn(),
            handleFailedSubscriptions: jest.fn(),
        } as unknown as ListenChannelsProvider;

        websocketClient = {
            getSessionId: jest.fn().mockReturnValue(wsSessionId),
        } as unknown as WebsocketClient;

        jest.spyOn(Container.prototype, 'get').mockImplementation((id: any) => {
            if (id === DINames.ConfigService) return configService;
            if (id === DINames.TokenService) return tokenService;
            if (id === DINames.ListenChannelsProvider) return listenChannelsProvider;
            if (id === DINames.WebsocketClient) return websocketClient;
            return null;
        });

        eventSubClient = new EventSubClient();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Method: Subscribe', () => {
        beforeEach(() => {
            jest.spyOn(eventSubClient as any, 'subscribe');
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should throw error (sessionId not found)', () => {
            jest.spyOn(websocketClient, 'getSessionId').mockReturnValue(null);

            expect(() => eventSubClient['subscribe'](null as any, null as any, null as any, null as any)).rejects.toThrow('Websocket session ID not found');
        });

        it('should throw error (failed to subscribe)', async () => {
            const mockBuilderInstance = new CreateEventSubSubscriptionRequestConfigBuilder();
            jest.spyOn(axios, 'request').mockResolvedValue({ status: mockBuilderInstance.errorResponseCodes[0] });
            await expect(eventSubClient['subscribe'](null as any, null as any, null as any, userAccessToken)).rejects.toThrow();

            expect(mockBuilderInstance.setClientId).toHaveBeenCalledWith(clientId);
            expect(mockBuilderInstance.setAccessToken).toHaveBeenCalledWith(userAccessToken);
            expect(mockBuilderInstance.setType).toHaveBeenCalled();
            expect(mockBuilderInstance.setCondition).toHaveBeenCalled();
            expect(mockBuilderInstance.setVersion).toHaveBeenCalled();
            expect(mockBuilderInstance.setSessionId).toHaveBeenCalledWith(wsSessionId);
            expect(mockBuilderInstance.build).toHaveBeenCalled();
        });

        it('should return response data', async () => {
            const mockBuilderInstance = new CreateEventSubSubscriptionRequestConfigBuilder();
            const responseData = { data: [{ id: 'sub-id' }] };
            jest.spyOn(axios, 'request').mockResolvedValue({ status: mockBuilderInstance.correctResponseCodes[0], data: responseData });

            await expect(eventSubClient['subscribe'](null as any, null as any, null as any, userAccessToken)).resolves.toEqual(responseData);

            expect(mockBuilderInstance.setClientId).toHaveBeenCalledWith(clientId);
            expect(mockBuilderInstance.setAccessToken).toHaveBeenCalledWith(userAccessToken);
            expect(mockBuilderInstance.setType).toHaveBeenCalled();
            expect(mockBuilderInstance.setCondition).toHaveBeenCalled();
            expect(mockBuilderInstance.setVersion).toHaveBeenCalled();
            expect(mockBuilderInstance.setSessionId).toHaveBeenCalledWith(wsSessionId);
            expect(mockBuilderInstance.build).toHaveBeenCalled();
        });
    });

    describe('Method: Unsubscribe', () => {
        let subId: string;

        beforeEach(() => {
            subId = 'sub-id';
            jest.spyOn(eventSubClient as any, 'unsubscribe');
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should throw error (failed to unsubscribe)', async () => {
            jest.spyOn(axios, 'request').mockResolvedValue({ status: 400 });

            const mockBuilderInstance = new DeleteEventSubSubscriptionRequestConfigBuilder();

            await expect(eventSubClient['unsubscribe'](subId, userAccessToken)).rejects.toThrow();

            expect(mockBuilderInstance.setClientId).toHaveBeenCalledWith(clientId);
            expect(mockBuilderInstance.setAccessToken).toHaveBeenCalledWith(userAccessToken);
            expect(mockBuilderInstance.setId).toHaveBeenCalledWith(subId);
            expect(mockBuilderInstance.build).toHaveBeenCalled();
        });

        it('should return response data', async () => {
            jest.spyOn(axios, 'request').mockResolvedValue({ status: 204 });

            const mockBuilderInstance = new DeleteEventSubSubscriptionRequestConfigBuilder();

            await expect(eventSubClient['unsubscribe'](subId, userAccessToken)).resolves.toBe(true);

            expect(mockBuilderInstance.setClientId).toHaveBeenCalledWith(clientId);
            expect(mockBuilderInstance.setAccessToken).toHaveBeenCalledWith(userAccessToken);
            expect(mockBuilderInstance.setId).toHaveBeenCalledWith(subId);
            expect(mockBuilderInstance.build).toHaveBeenCalled();
        });
    });

    describe('Method: List', () => {
        let requestBuilder: GetEventSubSubscriptionsRequestConfigBuilder;
        let responseData: any;

        beforeEach(() => {
            jest.spyOn(eventSubClient as any, 'list');
            requestBuilder = new GetEventSubSubscriptionsRequestConfigBuilder();
            responseData = {
                data: [
                    {
                        id: 'subscription-id',
                        type: TwitchEventId.ChannelChatMessage,
                        condition: { broadcaster_user_id: 'channelId', user_id: userId },
                    },
                ],
            };
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should throw NotFoundError if user token is not found', async () => {
            jest.spyOn(tokenService, 'getUserTokenById').mockResolvedValue(null);

            await expect(eventSubClient['list'](userId, {})).rejects.toThrow(NotFoundError);
        });

        it('should return data if request is successful', async () => {
            jest.spyOn(axios, 'request').mockResolvedValue({ status: 200, data: responseData });

            await expect(eventSubClient['list'](userId, {})).resolves.toEqual(responseData);
        });

        it('should throw error if request fails', async () => {
            jest.spyOn(axios, 'request').mockResolvedValue({ status: 500 });

            await expect(eventSubClient['list'](userId, {})).rejects.toThrow();

            expect(requestBuilder.setClientId).toHaveBeenCalledWith(clientId);
            expect(requestBuilder.setAccessToken).toHaveBeenCalledWith(userAccessToken);
            // setUserId, setType, setStatus - Only 1 of these should be called - do not check
            expect(requestBuilder.build).toHaveBeenCalled();
        });

        it('should use setAfter', async () => {
            jest.spyOn(axios, 'request').mockResolvedValue({ status: 200, data: responseData });

            await expect(eventSubClient['list'](userId, {}, 'after-id')).resolves.toEqual(responseData);
            expect(requestBuilder.setAfter).toHaveBeenCalled();
        });

        it('should use setUserId', async () => {
            jest.spyOn(axios, 'request').mockResolvedValue({ status: 200, data: responseData });

            await expect(eventSubClient['list'](userId, { userId })).resolves.toEqual(responseData);
            expect(requestBuilder.setUserId).toHaveBeenCalledWith(userId);
        });

        it('should use setType', async () => {
            jest.spyOn(axios, 'request').mockResolvedValue({ status: 200, data: responseData });

            await expect(eventSubClient['list'](userId, { type: TwitchEventId.ChannelBan })).resolves.toEqual(responseData);
            expect(requestBuilder.setType).toHaveBeenCalledWith(TwitchEventId.ChannelBan);
        });

        it('should use setStatus', async () => {
            jest.spyOn(axios, 'request').mockResolvedValue({ status: 200, data: responseData });

            await expect(eventSubClient['list'](userId, { status: 'enabled' })).resolves.toEqual(responseData);
            expect(requestBuilder.setStatus).toHaveBeenCalledWith('enabled');
        });
    });
});
