import 'reflect-metadata';
import dotenv from 'dotenv';
import { APIRateLimiterModule, CacheModule, ChatBotModule, CommandsModule, IChannelOptionsProvider, IListenChannelsProvider, InMemoryTokenRepository, ListenersModule, LogLevel, LogModule, TChannelOptions, TwitchBot } from '../index';
import PingCommand from './example/commands/Ping.command';
import ExampleCommand, { ChannelOptionsExtend } from './example/commands/Example.command';
import PrefixCommand from './example/commands/Prefix.command';
import CounterListener from './example/listeners/Counter.listener';
import ShowMessageListener from './example/listeners/ShowMessage.listener';
import RefreshCommand from './example/commands/Refresh.command';

dotenv.config();

const clientId = process.env.CLIENT_ID as string;
const clientSecret = process.env.CLIENT_SECRET as string;
const userId = process.env.USER_ID as string;
const userRefreshToken = process.env.USER_REFRESH_TOKEN as string;

class ListenChannelsProvider implements IListenChannelsProvider {
    private i = 0;
    private channels: string[] = []; //['87576158', '474118438', '66250925', '82197170', '58462752'];
    async getChannelIds(): Promise<string[]> {
        // return this.i++ % 2 == 0 ? this.channels : Array.from({ length: 10 }, (_, index) => (index * 123 + 82197170 + this.i - 1).toString());
        return this.channels;
    }

    getRefreshInterval(): number {
        return 1000 * 10;
    }
}

class ChannelOptionsProvider implements IChannelOptionsProvider<ChannelOptionsExtend> {
    private readonly baseOptions: ChannelOptionsExtend = {
        prefix: '!',
        eXampleExecutionCounter: 0,
    };
    private readonly changedOptions = new Map<string, ChannelOptionsExtend>();

    async getOptions(channelId: string): Promise<ChannelOptionsExtend> {
        if (this.changedOptions.has(channelId)) {
            return this.changedOptions.get(channelId) as ChannelOptionsExtend;
        }
        return this.baseOptions;
    }

    async setOptions(channelId: string, options: ChannelOptionsExtend): Promise<void> {
        this.changedOptions.set(channelId, options);
    }
}

@TwitchBot({
    client: {
        id: clientId,
        secret: clientSecret,
    },
    userId: userId,
    modules: [
        ChatBotModule.forRoot({
            listenChannels: { useClass: ListenChannelsProvider },
            channelOptions: { useClass: ChannelOptionsProvider },
            tokenRepository: { useValue: new InMemoryTokenRepository(userId, userRefreshToken) },
        }),
          CommandsModule.forRoot({
            commands: [PingCommand, ExampleCommand, PrefixCommand, RefreshCommand],
          }),
        ListenersModule.forRoot({
            listeners: [CounterListener, ShowMessageListener],
        }),
        CacheModule.forRoot(),
        APIRateLimiterModule.forRoot(),
        LogModule.forRoot({
            levels: [LogLevel.INFO, LogLevel.NORMAL, LogLevel.ERROR, LogLevel.WARN, LogLevel.DEBUG],
        })
    ]
})
class Bot {}
