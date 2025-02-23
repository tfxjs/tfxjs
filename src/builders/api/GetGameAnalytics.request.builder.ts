// https://dev.twitch.tv/docs/api/reference/#get-game-analytics

import BaseRequestBuilder from "./Base.request.builder";

// Typy

export type GetGameAnalyticsResponse = {
    data: {
        game_id: string;
        URL: string;
        type: string;
        date_range: {
            started_at: string;
            ended_at: string;
        };
    }[],
    pagination: {
        cursor: string;
    }
}

// Builder

export default class GetGameAnalyticsRequestConfigBuilder extends BaseRequestBuilder {
    correctResponseCodes: number[] = [200];
    errorResponseCodes: number[] = [400, 401, 404];

    constructor() {
        super('GET', 'https://api.twitch.tv/helix/analytics/games', {
            game_id: null,
            type: null,
            started_at: null,
            ended_at: null,
            first: null,
            after: null,
        });
    }

    public setGameId(game_id: string): this {
        this.config.data.game_id = game_id;
        return this;
    }

    public setType(type: string): this {
        this.config.data.type = type;
        return this;
    }

    public setStartedAt(started_at: string): this {
        this.config.data.started_at = started_at;
        return this;
    }

    public setEndedAt(ended_at: string): this {
        this.config.data.ended_at = ended_at;
        return this;
    }

    public setFirst(first: number): this {
        this.config.data.first = first;
        return this;
    }

    public setAfter(after: string): this {
        this.config.data.after = after;
        return this;
    }

    public checkTypes(): boolean {
        return true;
    }
}