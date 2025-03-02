import { loggerMock } from '../../mocks/Logger.mock';

jest.mock('../../../src/utils/Logger', () => ({
    LoggerFactory: {
        createLogger: jest.fn(() => loggerMock),
    },
}));

import DINames from '../../../src/utils/DI.names';
import { ChannelOptionsProvider } from '../../../src/providers/ChannelOptions.provider';
import { IChannelOptionsProvider, TChannelOptions } from '../../../src/types/ChannelOptions.provider';
import ConfigService from '../../../src/services/Config.service';
import { Container } from '@inversifyjs/container';

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

        jest.spyOn(Container.prototype, 'get').mockImplementation((id: any) => {
            if (id === DINames.ConfigService) return configService;
            if (id === DINames.UserDefinedChannelOptionsProvider) return optionsProvider;
            return null;
        });

        channelOptionsProvider = new ChannelOptionsProvider();
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