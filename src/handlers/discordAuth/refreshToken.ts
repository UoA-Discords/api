import { Request, Response } from 'express';
import { invalidRequestProperty } from '../../functions/invalidRequestProperty';
import { unknownErrorResponse } from '../../functions/unknownErrorResponse';
import { AuthDiscordAPI } from '../../classes/AuthDiscordAPI';

export async function refreshToken(req: Request, res: Response): Promise<void> {
    try {
        const { refresh_token } = req.body;

        if (typeof refresh_token !== `string`) {
            return invalidRequestProperty(res, `refresh_token`, `body`, `string`, refresh_token);
        }

        const response = await AuthDiscordAPI.refreshToken(refresh_token);

        res.status(200).json(response);

        await AuthDiscordAPI.logUserAction(req.ip, response.access_token, `refreshed`);
    } catch (error) {
        return unknownErrorResponse(req, res, error);
    }
}
