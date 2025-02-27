import { loggerMock } from '../../mocks/Logger.mock';

jest.mock('../../../src/utils/Logger', () => ({
    LoggerFactory: {
        createLogger: jest.fn(() => loggerMock),
    },
}));

import ListenChannelsProvider from '../../../src/providers/ListenChannels.provider';
import { IListenChannelsProvider, ListenChannelsCallback, ListenChannelSubscriptionResult } from '../../../src/types/ListenChannels.provider.types';
import ConfigService from '../../../src/services/Config.service';

describe('ListenChannelsProvider: Observer pattern', () => {
    let listenChannelsProvider: ListenChannelsProvider;
    let channelProvider: IListenChannelsProvider;
    let configService: ConfigService;

    const channelId = 'testChannelId';
    const userId = 'botUserId';
    const channelIds = [channelId, userId];

    beforeEach(() => {
        configService = {} as unknown as ConfigService;

        channelProvider = {
            getRefreshInterval: jest.fn().mockReturnValue(60000),
        } as unknown as IListenChannelsProvider;

        listenChannelsProvider = new ListenChannelsProvider(channelProvider, configService);
    });

    afterEach(() => {
        jest.clearAllMocks();
        if (listenChannelsProvider['refreshIntervalLoop']) clearInterval(listenChannelsProvider['refreshIntervalLoop']);
        if (listenChannelsProvider['apiCheckDelayInterval']) clearInterval(listenChannelsProvider['apiCheckDelayInterval']);
        if (listenChannelsProvider['apiCheckInterval']) clearInterval(listenChannelsProvider['apiCheckInterval']);
    });

    describe('Observer pattern', () => {
        it('should add and remove callbacks', () => {
            const callback: ListenChannelsCallback = jest.fn();
            listenChannelsProvider.onChannelsUpdated(callback);
            expect(listenChannelsProvider['callbacks']).toContain(callback);

            listenChannelsProvider.offChannelsUpdated(callback);
            expect(listenChannelsProvider['callbacks']).not.toContain(callback);
        });

        it('should emit channels updated event', () => {
            const callback: ListenChannelsCallback = jest.fn();
            listenChannelsProvider.onChannelsUpdated(callback);
            listenChannelsProvider['emitChannelsUpdated'](channelIds);
            expect(callback).toHaveBeenCalledWith(channelIds, [], channelIds);
        });
    });
});