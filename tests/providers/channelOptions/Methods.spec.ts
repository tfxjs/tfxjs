import { loggerMock } from '../../mocks/Logger.mock';

jest.mock('../../../src/utils/Logger', () => ({
    LoggerFactory: {
        createLogger: jest.fn(() => loggerMock),
    },
}));

import { Container } from 'typedi';
import DINames from '../../../src/utils/DI.names';
import { ChannelOptionsProvider } from '../../../src/providers/ChannelOptions.provider';
import { IChannelOptionsProvider, TChannelOptions } from '../../../src/types/ChannelOptions.provider';
import ConfigService from '../../../src/services/Config.service';

type ChannelExtendedOptions = TChannelOptions<{ test: string }>;

describe('ChannelOptionsProvider: Methods', () => {
    let channelOptionsProvider: ChannelOptionsProvider;
    let optionsProvider: IChannelOptionsProvider<ChannelExtendedOptions>;
    let configService: ConfigService;

    const channelOptions: TChannelOptions<ChannelExtendedOptions> = {
        prefix: '!',
        test: 'testValue',
    };

    beforeEach(() => {
        optionsProvider = {
            getOptions: jest.fn().mockResolvedValue(channelOptions),
            setOptions: jest.fn(),
        } as unknown as IChannelOptionsProvider<ChannelExtendedOptions>;

        configService = {
            getConfig: jest.fn(),
        } as unknown as ConfigService;

        Container.set(DINames.UserDefinedChannelOptionsProvider, optionsProvider);
        Container.set(DINames.ConfigService, configService);

        channelOptionsProvider = new ChannelOptionsProvider(optionsProvider, configService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Method: getChannelOptions', () => {
        it('should get channel options from the provider', async () => {
            const channelId = 'testChannel';
            const result = await channelOptionsProvider.getChannelOptions(channelId);
            expect(optionsProvider.getOptions).toHaveBeenCalledWith(channelId);
            expect(result).toEqual(channelOptions);
        });
    });

    describe('Method: setChannelOptions', () => {
        it('should set channel options using the provider', () => {
            const channelId = 'testChannel';
            channelOptionsProvider.setChannelOptions(channelId, channelOptions);
            expect(optionsProvider.setOptions).toHaveBeenCalledWith(channelId, channelOptions);
        });
    });
});