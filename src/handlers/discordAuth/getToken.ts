import { Request, Response } from 'express';
import { invalidRequestProperty } from '../../functions/invalidRequestProperty';
import { unknownErrorResponse } from '../../functions/unknownErrorResponse';
import { AuthDiscordAPI } from '../../classes/AuthDiscordAPI';
import { Loggers } from '../../classes/Loggers';

export async function getToken(req: Request, res: Response): Promise<void> {
    try {
        const { code, state } = req.query;

        if (typeof code !== `string`) {
            return invalidRequestProperty(res, `code`, `query`, `string`, code);
        }

        if (typeof state !== `string`) {
            return invalidRequestProperty(res, `state`, `query`, `string`, state);
        }

        const expectedState = AuthDiscordAPI.getWaitingState(req.ip);
        if (expectedState === undefined) {
            res.status(410).json(`No state expected from your IP, you most likely waited too long to authorize`);
            return;
        }

        if (expectedState !== state) {
            res.status(401).json(`State is not what was expected from your IP, possible CSRF attempt has occurred`);
            Loggers.sessions.state.log(`[WARNING] ${req.ip} (got ${state}, expected ${expectedState})`);
            return;
        }

        const response = await AuthDiscordAPI.getToken(code);

        res.status(200).json(response);

        AuthDiscordAPI.removeWaitingState(req.ip);
        await AuthDiscordAPI.logUserAction(req.ip, response.access_token, `logged in`);
    } catch (error) {
        return unknownErrorResponse(req, res, error);
    }
}
