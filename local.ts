// import 'reflect-metadata';
// import dotenv from 'dotenv';
// import { TwitchBot } from './src/decorators/TwitchBot.decorator';
// import { LogLevel } from './src/utils/Logger';
// import { IListenChannelsProvider } from './src/types/ListenChannels.provider.types';
// import { IChannelOptionsProvider, TChannelOptions } from './src/types/ChannelOptions.provider';
// import InMemoryTokenRepository from './src/example/repositories/InMemoryToken.repository';
// import PingCommand from './src/example/commands/Ping.command';
// import ExampleCommand from './src/example/commands/Example.command';
// import CounterListener from './src/example/listeners/Counter.listener';
// import ShowMessageListener from './src/example/listeners/ShowMessage.listener';
// import ChatBotModule from './src/modules/ChatBot.module';
// import CommandsModule from './src/modules/Commands.module';
// import ListenersModule from './src/modules/Listeners.module';
// import CacheModule from './src/modules/Cache.module';
// import APIRateLimiterModule from './src/modules/APIRateLimiter.module';

// dotenv.config();

// const clientId = process.env.CLIENT_ID as string;
// const clientSecret = process.env.CLIENT_SECRET as string;
// const userId = process.env.USER_ID as string;
// const userRefreshToken = process.env.USER_REFRESH_TOKEN as string;

// class ListenChannelsProvider implements IListenChannelsProvider {
//     private i = 0;
//     private channels: string[] = ['87576158', '474118438', '66250925', '82197170', '58462752'];
//     async getChannelIds(): Promise<string[]> {
//         // return this.i++ % 2 == 0 ? this.channels : [];
//         return this.channels;
//     }

//     getRefreshInterval(): number {
//         return 1000 * 10;
//     }
// }

// export type ChannelOptionsExtend = TChannelOptions<{
//     eXampleExecutionCounter: number;
// }>;

// class ChannelOptionsProvider implements IChannelOptionsProvider<ChannelOptionsExtend> {
//     private readonly baseOptions: ChannelOptionsExtend = {
//         prefix: '!',
//         eXampleExecutionCounter: 0,
//     };
//     private readonly changedOptions = new Map<string, ChannelOptionsExtend>();

//     async getOptions(channelId: string): Promise<ChannelOptionsExtend> {
//         if (this.changedOptions.has(channelId)) {
//             return this.changedOptions.get(channelId) as ChannelOptionsExtend;
//         }
//         return this.baseOptions;
//     }

//     async setOptions(channelId: string, options: ChannelOptionsExtend): Promise<void> {
//         this.changedOptions.set(channelId, options);
//     }
// }

// @TwitchBot({
//     client: {
//         id: clientId,
//         secret: clientSecret,
//     },
//     userId: userId,
//     modules: [
//         ChatBotModule.forRoot({
//             listenChannels: { useClass: ListenChannelsProvider },
//             channelOptions: { useClass: ChannelOptionsProvider },
//             tokenRepository: { useValue: new InMemoryTokenRepository(userId, userRefreshToken) },
//         }),
//           CommandsModule.forRoot({
//             commands: [PingCommand, ExampleCommand],
//           }),
//         ListenersModule.forRoot({
//             listeners: [CounterListener, ShowMessageListener],
//         }),
//         CacheModule.forRoot(),
//         APIRateLimiterModule.forRoot(),
//     ],
//     log: {
//         levels: [LogLevel.INFO, LogLevel.NORMAL, LogLevel.ERROR, LogLevel.WARN, LogLevel.DEBUG],
//     },
// })
// class Bot {}
