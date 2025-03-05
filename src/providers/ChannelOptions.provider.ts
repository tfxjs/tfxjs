import deprecated from "../decorators/Deprecated.decorator";
import { DIContainer } from "../di/Container";
import { TChannelOptions, IChannelOptionsProvider, ChannelBaseOptions } from "../types/ChannelOptions.provider";
import DINames from "../utils/DI.names";
import { Logger, LoggerFactory } from "../utils/Logger";

export class ChannelOptionsProvider<T extends ChannelBaseOptions & Record<string, any> = ChannelBaseOptions> {
    private readonly optionsProvider: IChannelOptionsProvider<T>;

    private logger: Logger;

    constructor() {
        this.logger = LoggerFactory.createLogger('ChannelOptionsProvider');

        this.optionsProvider = DIContainer.get<IChannelOptionsProvider<T>>(DINames.UserDefinedChannelOptionsProvider);

        // TODO: Cache

        this.logger.debug('Initialized');
    }

    private async getOptions(channelId: string): Promise<TChannelOptions<T>> {
        const optionsFromProvider = await this.optionsProvider.getOptions(channelId);
        return optionsFromProvider;
    }

    private async saveOptions(channelId: string, options: TChannelOptions<T>): Promise<void> {
        return await this.optionsProvider.setOptions(channelId, options);
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

    /**
     * @deprecated Use `newMethod` instead.
     */
    @deprecated('Use setChannelOptions instead')
    setChannelOptions(channelId: string, options: TChannelOptions<T>): void {
        this.logger.debug(`Setting channel options for channel ${channelId}`);
        this.saveOptions(channelId, options);
    }

    getChannelOptionsSaver<O extends keyof T>(channelId: string) {
        const saver = async (key: O, value: T[O]) => {
            try {
                const currentOptions = await this.getOptions(channelId);
                // Check if the key exists in the current options
                if (!Object.keys(currentOptions).includes(key as string)) {
                    this.logger.warn(`Key ${key as string} does not exist in the current options for channel ${channelId}`);
                    return;
                }
                // Save
                await this.saveOptions(channelId, {
                    ...currentOptions,
                    [key]: value,
                });
            } catch (error) {
                this.logger.error(`Failed to save channel options for channel ${channelId}: ${error}`);
            }
        };
        return saver.bind(this);
    }
}