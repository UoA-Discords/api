export interface IConfig {
    /** Port the API will listen on. */
    port: number;

    discordClientID: string;
    discordClientSecret: string;
    discordRedirectURI: string;

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
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
export const Config: IConfig = require(`../../config.json`);
