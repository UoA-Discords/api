import { Request, Response } from 'express';
import { invalidRequestProperty } from '../../functions/invalidRequestProperty';
import { unknownErrorResponse } from '../../functions/unknownErrorResponse';
import { AuthDiscordAPI } from '../../classes/AuthDiscordAPI';

export async function revokeToken(req: Request, res: Response): Promise<void> {
    try {
        const { token } = req.body;

        if (typeof token !== `string`) {
            return invalidRequestProperty(res, `token`, `body`, `string`, token);
        }

        try {
            await AuthDiscordAPI.logUserAction(req.ip, token, `logged out`);
        } catch (error) {
            res.status(400).json((error as Error).message);
            return;
        }

        res.status(200).json(await AuthDiscordAPI.revokeToken(token));
    } catch (error) {
        return unknownErrorResponse(req, res, error);
    }
}
