import { loggerMock } from '../../mocks/Logger.mock';

jest.mock('../../../src/utils/Logger', () => ({
    LoggerFactory: {
        createLogger: jest.fn(() => loggerMock),
    },
}));

import EventSubClient from '../../../src/clients/EventSub.client';
import ConfigService from '../../../src/services/Config.service';
import { TokenService } from '../../../src/services/Token.service';
import ListenChannelsProvider from '../../../src/providers/ListenChannels.provider';
import WebsocketClient from '../../../src/clients/Websocket.client';

describe('EventSubClient: Channel Methods', () => {
    let eventSubClient: EventSubClient;

    let configService: ConfigService;
    let tokenService: TokenService;
    let listenChannelsProvider: ListenChannelsProvider;
    let websocketClient: WebsocketClient;

    beforeEach(() => {
        configService = {} as unknown as ConfigService;

        tokenService = {} as unknown as TokenService;

        listenChannelsProvider = {
            refreshChannels: jest.fn(),
            onChannelsUpdated: jest.fn(),
            handleFailedSubscriptions: jest.fn(),
        } as unknown as ListenChannelsProvider;

        websocketClient = {} as unknown as WebsocketClient;

        eventSubClient = new EventSubClient(configService, tokenService, listenChannelsProvider, websocketClient);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Method: listenChannelsProviderCallback', () => {
        let channels: string[];
        let newChannels: string[];
        let removedChannels: string[];

        beforeEach(() => {
            jest.spyOn(eventSubClient as any, 'listenChannelsProviderCallback');
            jest.spyOn(eventSubClient as any, 'listenChat').mockImplementation(() => Promise.resolve(true));
            jest.spyOn(eventSubClient as any, 'unlistenChat').mockImplementation(() => Promise.resolve(true));

            newChannels = ['newChannel1', 'newChannel2'];
            removedChannels = ['removedChannel1', 'removedChannel2'];
            channels = [...newChannels, 'channel1', 'channel2'];
        });

        afterEach(() => {
            jest.clearAllMocks();
        });

        it('should call listenChat for newChannels and unlistenChat for removedChannels', () => {
            eventSubClient['listenChannelsProviderCallback'](channels, removedChannels, newChannels);

            expect(eventSubClient['listenChat']).toHaveBeenCalledTimes(2);
            expect(eventSubClient['listenChat']).toHaveBeenNthCalledWith(1, newChannels[0]);
            expect(eventSubClient['listenChat']).toHaveBeenNthCalledWith(2, newChannels[1]);

            expect(eventSubClient['unlistenChat']).toHaveBeenCalledTimes(2);
            expect(eventSubClient['unlistenChat']).toHaveBeenNthCalledWith(1, removedChannels[0]);
            expect(eventSubClient['unlistenChat']).toHaveBeenNthCalledWith(2, removedChannels[1]);

            expect(listenChannelsProvider.handleFailedSubscriptions).not.toHaveBeenCalled();
        });

        it('should call listenChat for newChannels and handle failed subscriptions', async () => {
            jest.spyOn(eventSubClient as any, 'listenChat').mockImplementation((channel) => {
                if (channel === 'newChannel1') return Promise.reject(new Error('Failed to listen'));
                return Promise.resolve(true);
            });

            await eventSubClient['listenChannelsProviderCallback'](channels, [], newChannels);

            expect(eventSubClient['unlistenChat']).not.toHaveBeenCalled();

            expect(eventSubClient['listenChat']).toHaveBeenCalledTimes(2);
            expect(eventSubClient['listenChat']).toHaveBeenNthCalledWith(1, 'newChannel1');
            expect(eventSubClient['listenChat']).toHaveBeenNthCalledWith(2, 'newChannel2');

            expect(listenChannelsProvider.handleFailedSubscriptions).toHaveBeenCalledWith([{ success: false, channel: 'newChannel1', code: -1 }], []);
        });

        it('should call unlistenChannel for removedChannels and handle failed subscriptions', async () => {
            jest.spyOn(eventSubClient as any, 'unlistenChat').mockImplementation((channel) => {
                if (channel === 'removedChannel1') return Promise.reject(new Error('Failed to unlisten'));
                return Promise.resolve(true);
            });

            await eventSubClient['listenChannelsProviderCallback'](channels, removedChannels, []);

            expect(eventSubClient['listenChat']).not.toHaveBeenCalled();

            expect(eventSubClient['unlistenChat']).toHaveBeenCalledTimes(2);
            expect(eventSubClient['unlistenChat']).toHaveBeenNthCalledWith(1, 'removedChannel1');
            expect(eventSubClient['unlistenChat']).toHaveBeenNthCalledWith(2, 'removedChannel2');

            expect(listenChannelsProvider.handleFailedSubscriptions).toHaveBeenCalledWith([], [{ success: false, channel: 'removedChannel1', code: -1 }]);
        });
    });
});
