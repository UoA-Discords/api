import rateLimit from 'express-rate-limit';
import { Config } from '../global/Config';

const bypassTokens = new Set(Config.rateLimitBypassTokens);

export const customRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: Config.maxRequestsPerMinute,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req, res) => {
        const token = req.get(`RateLimit-Bypass-Token`);
        if (token === undefined) return false;

        if (typeof token !== `string`) {
            res.setHeader(`RateLimit-Bypass-Response`, `Expected string, got '${typeof token}'`);
            return false;
        }

        if (!bypassTokens.has(token)) {
            res.setHeader(`RateLimit-Bypass-Response`, `Invalid`);
            return false;
        }

        res.setHeader(`RateLimit-Bypass-Response`, `Valid`);
        return true;
    },
});
