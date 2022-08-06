import { Request, Response } from 'express';
import { UserDatabase } from '../../classes/Databases';
import { unknownErrorResponse } from '../../functions/unknownErrorResponse';
import { extractUserId } from './extractUserId';

export function getSiteUserById(req: Request, res: Response): void {
    try {
        const id = extractUserId(req, res);
        if (id === undefined) return;

        res.status(200).json(UserDatabase.get(id));
    } catch (error) {
        return unknownErrorResponse(req, res, error);
    }
}
