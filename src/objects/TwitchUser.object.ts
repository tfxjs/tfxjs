import TwitchUserCache from '../cache/TwitchUser.cache';
import DINames from '../utils/DI.names';
import { ITwitchUser, IPartialTwitchUser, IChatterUser, Badge, BadgeSetId, TwitchUserType, TwitchUserBroadcasterType } from '../types/twitch/TwitchUser.types';
import { Logger, LoggerFactory } from '../utils/Logger';
import APIClient from '../clients/Api.client';
import { DIContainer } from '../di/Container';

export class PartialTwitchUser {
    constructor(private readonly data: IPartialTwitchUser) {}

    getId(): string {
        return this.data.id;
    }

    getLogin(): string {
        return this.data.login;
    }

    getUsername(): string {
        return this.data.name;
    }
}

export class TwitchUser {
    private logger: Logger;
    private _cache: TwitchUserCache | undefined = undefined;
    private _api: APIClient | undefined = undefined;

    private get cache() : TwitchUserCache | undefined  {
        if(this._cache == null){
            if(!DIContainer.isBound(DINames.TwitchUserCache)) {
                this.logger.debug(`Cache is not defined. Using API to fetch data.`);
                return;
            }
            this._cache = DIContainer.get(DINames.TwitchUserCache);
        }
        return this._cache;
    }

    private get api() : APIClient {
        if(this._api == null) {
            if(!DIContainer.isBound(DINames.APIClient)) throw new Error(`APIClient is not defined.`);
            this._api = DIContainer.get(DINames.APIClient);
        }
        return this._api as APIClient;
    }

    constructor(private readonly id: string) {
        this.logger = LoggerFactory.createLogger(`TwitchUser:${id}`);
    }

    private async getCachedUser(): Promise<ITwitchUser> {
        let user : ITwitchUser | null = null;
        if(this.cache) {
            user = await this.cache.get(this.id);
        } else {
            user = await this.api.getUserById(this.id);
        }
        if(user == null) throw new Error('Cannot obtain user data. Check console for more information.');
        return user;
    }

    getId(): string {
        return this.id;
    }

    async getLogin(): Promise<string> {
        const user = await this.getCachedUser();
        return user.login;
    }

    async getDisplayName(): Promise<string> {
        const user = await this.getCachedUser();
        return user.display_name;
    }

    async getType(): Promise<TwitchUserType> {
        const user = await this.getCachedUser();
        return user.type;
    }

    async getBroadcasterType(): Promise<TwitchUserBroadcasterType> {
        const user = await this.getCachedUser();
        return user.broadcaster_type;
    }

    async getDescription(): Promise<string> {
        const user = await this.getCachedUser();
        return user.description;
    }

    async getProfileImageUrl(): Promise<string> {
        const user = await this.getCachedUser();
        return user.profile_image_url;
    }

    async getOfflineImageUrl(): Promise<string> {
        const user = await this.getCachedUser();
        return user.offline_image_url;
    }

    async getEmail(): Promise<string | null> {
        const user = await this.getCachedUser();
        return user.email ? user.email : null;
    }
}

export class ChatterUser extends TwitchUser {
    constructor(private readonly data: IChatterUser) {
        super(data.chatter_user_id);
    }

    getId(): string {
        return this.data.chatter_user_id;
    }

    getUsername(): string {
        return this.data.chatter_user_name;
    }

    getColor(): string {
        return this.data.color;
    }

    getBadges(): Badge[] {
        return this.data.badges;
    }

    hasBadge(setId: BadgeSetId): boolean {
        return this.getBadges().some((badge) => badge.set_id === setId);
    }

    // Broadcaster, Moderator, VIP

    isBroadcaster(): boolean {
        return this.hasBadge(BadgeSetId.Broadcaster);
    }

    isModerator(): boolean {
        return this.hasBadge(BadgeSetId.Moderator);
    }

    isVIP(): boolean {
        return this.hasBadge(BadgeSetId.Vip);
    }

    // Subscriber

    isSubscriber(): boolean {
        return this.hasBadge(BadgeSetId.Subscriber);
    }

    getSubscriberMonths(): number {
        const badge = this.getBadges().find((badge) => badge.set_id === BadgeSetId.Subscriber);
        if (badge == null) return 0;
        const months = parseInt(badge.info);
        return isNaN(months) ? 0 : months;
    }

    // SubGifter

    isSubGifter(): boolean {
        return this.hasBadge(BadgeSetId.SubGifter);
    }

    /**
     * Returns the number of gifted subscriptions (From badge, not real data)
     * @returns {number} The number of gifted subscriptions
     */
    getGiftedSubs(): number {
        const badge = this.getBadges().find((badge) => badge.set_id === BadgeSetId.SubGifter);
        if (badge == null) return 0;
        const subs = parseInt(badge.set_id);
        return isNaN(subs) ? 0 : subs;
    }

    // BitsGifter

    isBitsGift(): boolean {
        return this.hasBadge(BadgeSetId.BitsGifter);
    }

    /**
     * Returns the number of gifted bits (From badge, not real data)
     * @returns {number} The number of gifted bits
     */
    getGiftedBits(): number {
        const badge = this.getBadges().find((badge) => badge.set_id === BadgeSetId.BitsGifter);
        if (badge == null) return 0;
        const subs = parseInt(badge.set_id);
        return isNaN(subs) ? 0 : subs;
    }
}