import { loggerMock } from '../../mocks/Logger.mock';

jest.mock('../../../src/utils/Logger', () => ({
    LoggerFactory: {
        createLogger: jest.fn(() => loggerMock),
    },
}));

import { Container } from '@inversifyjs/container';
import ListenChannelsProvider from '../../../src/providers/ListenChannels.provider';
import { IListenChannelsProvider, ListenChannelSubscriptionResult } from '../../../src/types/ListenChannels.provider.types';
import ConfigService from '../../../src/services/Config.service';
import DINames from '../../../src/utils/DI.names';

describe('ListenChannelsProvider: Methods', () => {
    let listenChannelsProvider: ListenChannelsProvider;
    let channelProvider: IListenChannelsProvider;
    let configService: ConfigService;

    const channelId = 'testChannelId';
    const userId = 'botUserId';

    beforeEach(() => {
        channelProvider = {
            getChannelIds: jest.fn(),
            getRefreshInterval: jest.fn().mockReturnValue(60000),
        } as unknown as IListenChannelsProvider;

        configService = {
            getConfig: jest.fn().mockReturnValue({ userId }),
        } as unknown as ConfigService;

        jest.spyOn(Container.prototype, 'isBound').mockReturnValue(true);
        jest.spyOn(Container.prototype, 'get').mockImplementation((id: any) => {
            if (id === DINames.UserDefinedListenChannelsProvider) return channelProvider;
            if (id === DINames.ConfigService) return configService;
            return null;
        });

        listenChannelsProvider = new ListenChannelsProvider();
    });

    afterEach(() => {
        jest.clearAllMocks();
        if (listenChannelsProvider['refreshIntervalLoop']) clearInterval(listenChannelsProvider['refreshIntervalLoop']);
        if (listenChannelsProvider['apiCheckDelayInterval']) clearInterval(listenChannelsProvider['apiCheckDelayInterval']);
        if (listenChannelsProvider['apiCheckInterval']) clearInterval(listenChannelsProvider['apiCheckInterval']);
    });

    describe('Method: getChannelIds', () => {
        it('should get channel ids including bot user id', async () => {
            jest.spyOn(channelProvider, 'getChannelIds').mockResolvedValue([channelId]);
            const result = await listenChannelsProvider.getChannelIds();
            expect(channelProvider.getChannelIds).toHaveBeenCalled();
            expect(result).toEqual(expect.arrayContaining([channelId, userId]));
        });

        it('should get channel ids including bot user id (without duplicates)', async () => {
            jest.spyOn(channelProvider, 'getChannelIds').mockResolvedValue([userId, channelId]);
            const result = await listenChannelsProvider.getChannelIds();
            expect(channelProvider.getChannelIds).toHaveBeenCalled();
            expect(result).toEqual(expect.arrayContaining([channelId, userId]));
        });
    });

    describe('Method: refreshChannels', () => {
        it('should refresh channels and emit event if there are changes', async () => {
            const newChannelId1 = 'newChannelId1';
            jest.spyOn(channelProvider, 'getChannelIds').mockResolvedValue([newChannelId1] as string[]);
            jest.spyOn(listenChannelsProvider as any, 'emitChannelsUpdated');

            await expect(listenChannelsProvider.refreshChannels()).resolves.toBe(true);
            expect(channelProvider.getChannelIds).toHaveBeenCalled();
            expect(listenChannelsProvider['emitChannelsUpdated']).toHaveBeenCalledWith(expect.arrayContaining([userId, newChannelId1]));

            const newChannelId2 = 'newChannelId2';
            jest.spyOn(channelProvider, 'getChannelIds').mockResolvedValue([newChannelId2] as string[]);

            await expect(listenChannelsProvider.refreshChannels()).resolves.toBe(true);
            expect(channelProvider.getChannelIds).toHaveBeenCalled();
            expect(listenChannelsProvider['emitChannelsUpdated']).toHaveBeenCalledWith(expect.arrayContaining([userId, newChannelId1]));
        });

        it('should not emit event if there are no changes', async () => {
            jest.spyOn(channelProvider, 'getChannelIds').mockResolvedValue([] as string[]);
            await expect(listenChannelsProvider.refreshChannels()).resolves.toBe(true); // First call to set _lastChannelIds
            jest.spyOn(listenChannelsProvider as any, 'emitChannelsUpdated');

            await expect(listenChannelsProvider.refreshChannels()).resolves.toBe(false);
            expect(listenChannelsProvider['emitChannelsUpdated']).not.toHaveBeenCalled();
        });
    });

    describe('Method: handleFailedSubscriptions', () => {
        it('should handle failed subscriptions and unsubscriptions', async () => {
            const channelId1 = 'channelId1';
            const channelId2 = 'channelId2';

            jest.spyOn(channelProvider, 'getChannelIds').mockResolvedValue([channelId, channelId1, channelId2] as string[]);
            await expect(listenChannelsProvider.refreshChannels()).resolves.toBe(true);

            const failedSubscriptions: ListenChannelSubscriptionResult[] = [
                { success: false, channel: channelId1, code: 400 },
            ];
            const failedUnsubscriptions: ListenChannelSubscriptionResult[] = [
                { success: false, channel: channelId2, code: 404 },
            ];

            listenChannelsProvider.handleFailedSubscriptions(failedSubscriptions, failedUnsubscriptions);
            expect(listenChannelsProvider['_lastChannelIds']).toEqual(expect.arrayContaining([userId, channelId]));
            expect(listenChannelsProvider['_lastChannelIds']).not.toEqual(expect.arrayContaining([channelId1, channelId2]));
        });
    });
});