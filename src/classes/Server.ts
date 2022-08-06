import cors from 'cors';
import express, { Express } from 'express';
import rateLimit from 'express-rate-limit';
import { Config } from '../global/Config';
import { appRoutes } from '../handlers';
import { Loggers } from './Loggers';

export class Server {
    private readonly _app: Express = express();

    public constructor() {
        this._app.use(cors());
        this._app.use(express.json());

        this._app.set(`trust proxy`, Config.numProxies);

        // 30 requests per minute
        const bypassTokens = new Set<string>(Config.rateLimitBypassTokens);
        this._app.use(
            rateLimit({
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
            }),
        );

        this._app.get(`/`, (_, res) => {
            res.sendStatus(200);
        });

        this._app.get(`/ip`, (req, res) => res.send(req.ip));

        appRoutes(this._app, ``);

        const listener = this._app.listen(Config.port, () => {
            const addressInfo = listener.address();
            if (typeof addressInfo === `string`) {
                Loggers.info.log(`Listening on ${addressInfo}`);
            } else if (addressInfo === null) {
                Loggers.info.log(`Listening on port NULL, that doesn't seem right`);
            } else {
                Loggers.info.log(
                    `Listening on ${addressInfo.address.replace(`::`, `localhost`)}:${addressInfo.port} (${
                        addressInfo.family
                    })`,
                );
            }
        });
    }
}
