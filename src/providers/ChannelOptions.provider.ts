import Container, { Inject, Service } from "typedi";
import { TChannelOptions, IChannelOptionsProvider, ChannelBaseOptions } from "../types/ChannelOptions.provider";
import DINames from "../utils/DI.names";
import { Logger, LoggerFactory } from "../utils/Logger";

@Service(DINames.ChannelOptionsProvider)
export class ChannelOptionsProvider<T extends ChannelBaseOptions & Record<string, any> = ChannelBaseOptions> {
    private readonly optionsProvider: IChannelOptionsProvider<T>;

    private logger: Logger;

    constructor() {
        this.logger = LoggerFactory.createLogger('ChannelOptionsProvider');

        this.optionsProvider = Container.get<IChannelOptionsProvider<T>>(DINames.UserDefinedChannelOptionsProvider);

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