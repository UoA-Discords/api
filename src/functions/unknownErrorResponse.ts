import { Request, Response } from 'express';
import { Loggers } from '../classes/Loggers';
import { DiscordAPIError, handleDiscordError } from '../shared/DiscordAPI';

/**
 * Handles logging and displaying an error message if an unknown error
 * occurred while processing a HTTP request.
 */
export function unknownErrorResponse(req: Request, res: Response, error: unknown) {
    if (error instanceof DiscordAPIError) {
        Loggers.info.log(
            `[WARN] Received a DiscordAPIError, please don't pre-emptively handle these (endpoint: ${req.method} ${req.url})`,
        );
        res.status(400).json(error.data);
        return;
    }
    const finalError = handleDiscordError(error);
    if (finalError instanceof DiscordAPIError) {
        res.status(400).json(finalError.data);
        return;
    }

    Loggers.error.log(`${req.method} ${req.url}`, finalError);
    res.sendStatus(500);
}
