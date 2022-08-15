/* eslint-disable @typescript-eslint/no-var-requires */
import { GuildVerificationLevel } from 'discord-api-types/v10';
import { existsSync } from 'fs';

export interface IConfig {
    /** Port the API will listen on. */
    port: number;

    discordClientID: string;
    discordClientSecret: string;
    discordRedirectURI: string;

    /** String to sign Json Web Tokens with, do not make this easy to guess. */
    jwtSecret: string;

    /**
     * Requests with any of these values in their
     * "RateLimit-Bypass-Token" header will bypass rate limiting.
     */
    rateLimitBypassTokens: string[];

    /**
     * Maximum number requests a user is allowed to make to the API in a 1 minute window.
     *
     * Requests with a valid "RateLimit-Bypass-Token" header will not contribute towards
     * this value.
     */
    maxRequestsPerMinute: number;

    /**
     * Number of proxies (such as Cloudflare, AWS ELB, or Nginx) to skip for ratelimiting functionality.
     *
     * For more information see the {@link https://www.npmjs.com/package/express-rate-limit#:~:text=Troubleshooting%20Proxy%20Issues Express Rate Limit docs}.
     */
    numProxies: number;

    /** Requirements for guilds to be considered. */
    applyRequirements: {
        /** Guilds below this member count will be automatically denied. */
        memberCount: number;
        /** Guilds below this verification level will be automatically denied. */
        verificationLevel: GuildVerificationLevel;
    };

    /**
     * Do not include this in your `config.json` file, it is automatically read from
     * the root `package.json` file.
     */
    version: string;

    /** Do not include this in your `config.json` file, it is automatically created. */
    startedAt: string;
}

export const Config: IConfig = existsSync(`../../config.json`)
    ? require(`../../config.json`)
    : require(`../../config.example.json`);

Config.version = process.env[`NPM_VERSION`] || require(`../../package.json`).version;

Config.startedAt = new Date().toISOString();
