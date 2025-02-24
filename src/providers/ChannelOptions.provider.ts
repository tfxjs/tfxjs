import { Inject, Service } from "typedi";
import { TChannelOptions, IChannelOptionsProvider, ChannelBaseOptions } from "../types/ChannelOptions.provider";
import DINames from "../utils/DI.names";
import ConfigService from "../services/Config.service";
import { Logger, LoggerFactory } from "../utils/Logger";

@Service(DINames.ChannelOptionsProvider)
export class ChannelOptionsProvider<T extends ChannelBaseOptions & Record<string, any> = ChannelBaseOptions> {
    private logger: Logger;

    constructor(
        @Inject(DINames.UserDefinedChannelOptionsProvider) private readonly optionsProvider: IChannelOptionsProvider<T>,
        @Inject(DINames.ConfigService) private readonly configService: ConfigService,
    ) {
        this.logger = LoggerFactory.createLogger('ChannelOptionsProvider');
        // TODO: Cache
        this.logger.debug('Initialized');
    }

    private async getOptions(channelId: string): Promise<TChannelOptions<T>> {
        const optionsFromProvider = await this.optionsProvider.getOptions(channelId);
        return optionsFromProvider;
    }

    private saveOptions(channelId: string, options: TChannelOptions<T>): void {
        this.optionsProvider.setOptions(channelId, options);
    }

    /**
     * Get channel options (get options from cache or provider defined by user)
     * @param channelId ChannelId
     * @returns ChannelOptions Record {@link ChannelOptionsRecord}
     */
    getChannelOptions(channelId: string): TChannelOptions<T> | Promise<TChannelOptions<T>> {
        this.logger.debug(`Getting channel options for channel ${channelId}`);
        return this.getOptions(channelId);
    }

    setChannelOptions(channelId: string, options: TChannelOptions<T>): void {
        this.logger.debug(`Setting channel options for channel ${channelId}`);
        this.saveOptions(channelId, options);
    }
}