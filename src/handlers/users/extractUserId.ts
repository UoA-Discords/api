import { Request, Response } from 'express';
import { UserDatabase } from '../../classes/Databases';
import { invalidRequestProperty } from '../../functions/invalidRequestProperty';

const validId = new RegExp(/^[0-9]{17,}$/);

/** Gets the user ID out of the request URL parameters (e.g. "/users/:id:/endpoint"). */
export function extractUserId(req: Request, res: Response): string | void {
    const { id } = req.params;

    if (id === undefined) {
        return invalidRequestProperty(res, `id`, `params`, `string`, id);
    }

    if (!validId.test(id)) {
        res.status(400).json(`ID must match ${validId}`);
        return;
    }

    if (!UserDatabase.has(id)) {
        res.status(404).json(`User not found`);
        return;
    }

    return id;
}
