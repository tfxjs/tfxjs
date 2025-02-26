import { loggerMock } from '../../mocks/Logger.mock';

jest.mock('../../../src/utils/Logger', () => ({
    LoggerFactory: {
        createLogger: jest.fn(() => loggerMock),
    },
}));

import EventSubClient from '../../../src/clients/EventSub.client';
import { UsableUserToken, UsableUserTokenWithScopes } from '../../../src/types/Token.repository.types';
import TwtichPermissionScope from '../../../src/enums/TwitchPermissionScope.enum';
import ConfigService from '../../../src/services/Config.service';
import { TokenService } from '../../../src/services/Token.service';
import ListenChannelsProvider from '../../../src/providers/ListenChannels.provider';
import WebsocketClient from '../../../src/clients/Websocket.client';
import NotFoundError from '../../../src/errors/NotFound.error';
import TwitchEventId from '../../../src/enums/TwitchEventId.enum';

describe('EventSubClient: Chat Methods', () => {
    let eventSubClient: EventSubClient;

    let configService: ConfigService;
    let tokenService: TokenService;
    let listenChannelsProvider: ListenChannelsProvider;
    let websocketClient: WebsocketClient;

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

        listenChannelsProvider = {} as unknown as ListenChannelsProvider;

        websocketClient = {} as unknown as WebsocketClient;

        eventSubClient = new EventSubClient(configService, tokenService, listenChannelsProvider, websocketClient);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Method: listenChat', () => {
        let userId: string;
        let channelId: string;

        beforeEach(() => {
            jest.spyOn(eventSubClient as any, 'listenChat');

            userId = 'userId';
            channelId = 'channelId';
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should throw error if user token is not found', async () => {
            jest.spyOn(tokenService, 'getUserTokenWithScopesById').mockResolvedValue(null);

            await expect(eventSubClient.listenChat(channelId)).rejects.toThrow('User token not found');
        });

        it('should throw error if user token does not have required scope user:bot', async () => {
            const invalidToken = { ...userAccessToken, scopes: [] };
            jest.spyOn(tokenService, 'getUserTokenWithScopesById').mockResolvedValue(invalidToken);

            await expect(eventSubClient.listenChat(channelId)).rejects.toThrow('User token does not have required scope user:bot');
        });

        it('should throw error if user token does not have required scope channel:bot', async () => {
            const invalidToken = { ...userAccessToken, scopes: [TwtichPermissionScope.UserBot] };
            jest.spyOn(tokenService, 'getUserTokenWithScopesById').mockResolvedValue(invalidToken);

            await expect(eventSubClient.listenChat(channelId)).rejects.toThrow('User token does not have required scope channel:bot');
        });

        it('should call subscribe with correct parameters', async () => {
            const subscribeSpy = jest.spyOn(eventSubClient as any, 'subscribe').mockResolvedValue(true);

            await expect(eventSubClient.listenChat(channelId)).resolves.toBe(true);
            expect(subscribeSpy).toHaveBeenCalledWith(TwitchEventId.ChannelChatMessage, { broadcaster_user_id: channelId, user_id: userId }, 1, userAccessTokenWithScopes);
        });

        it('should handle subscribe failure', async () => {
            const errorMessage = 'Failed to subscribe';
            jest.spyOn(eventSubClient as any, 'subscribe').mockRejectedValue(new Error(errorMessage));

            await expect(eventSubClient.listenChat(channelId)).rejects.toThrow(errorMessage);
        });
    });

    describe('Method: unlistenChat', () => {
        let channelId: string;

        beforeEach(() => {
            jest.spyOn(eventSubClient as any, 'unlistenChat');
            channelId = 'channelId';
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should throw NotFoundError if subscription is not found', async () => {
            jest.spyOn(eventSubClient as any, 'list').mockResolvedValue({ data: [] });

            await expect(eventSubClient.unlistenChat(channelId)).rejects.toThrow(NotFoundError);
        });

        it('should throw NotFoundError if user token is not found', async () => {
            jest.spyOn(eventSubClient as any, 'list').mockResolvedValue({
                data: [
                    {
                        type: TwitchEventId.ChannelChatMessage,
                        condition: { broadcaster_user_id: channelId, user_id: userId },
                    },
                ],
            });
            jest.spyOn(tokenService, 'getUserTokenById').mockResolvedValue(null);

            await expect(eventSubClient.unlistenChat(channelId)).rejects.toThrow(NotFoundError);
        });

        it('should call unsubscribe with correct parameters', async () => {
            const subscriptionId = 'subscription-id';
            jest.spyOn(eventSubClient as any, 'list').mockResolvedValue({
                data: [
                    {
                        id: subscriptionId,
                        type: TwitchEventId.ChannelChatMessage,
                        condition: { broadcaster_user_id: channelId, user_id: userId },
                    },
                ],
            });
            jest.spyOn(eventSubClient as any, 'unsubscribe').mockResolvedValue(true);

            await expect(eventSubClient.unlistenChat(channelId)).resolves.toBe(true);
            expect(eventSubClient['unsubscribe']).toHaveBeenCalledWith(subscriptionId, userAccessToken);
        });

        it('should handle unsubscribe failure', async () => {
            const subscriptionId = 'subscription-id';
            jest.spyOn(eventSubClient as any, 'list').mockResolvedValue({
                data: [
                    {
                        id: subscriptionId,
                        type: TwitchEventId.ChannelChatMessage,
                        condition: { broadcaster_user_id: channelId, user_id: userId },
                    },
                ],
            });
            jest.spyOn(eventSubClient as any, 'unsubscribe').mockRejectedValue(new Error('Failed to unsubscribe'));

            await expect(eventSubClient.unlistenChat(channelId)).rejects.toThrow('Failed to unsubscribe');
        });
    });
});
