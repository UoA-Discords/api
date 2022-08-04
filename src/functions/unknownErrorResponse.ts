import { Request, Response } from 'express';
import { Loggers } from '../classes/Loggers';
import { handleDiscordError } from '../shared/DiscordAPI';

/**
 * Handles logging and displaying an error message if an unknown error
 * occurred while processing a HTTP request.
 */
export function unknownErrorResponse(req: Request, res: Response, error: unknown) {
    const { error: finalError, isDiscordError } = handleDiscordError(error);
    if (isDiscordError) {
        res.status(400).json(finalError);
        return;
    }

    Loggers.error.log(`${req.method} ${req.url}`, finalError);
    res.sendStatus(500);
}
