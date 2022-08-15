import { RequestHandler } from 'express';
import { OptOutDatabase } from '../../classes/Databases';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { UserPermissionLevels } from '../../shared/Types/User';

export const getOptOutEntries: RequestHandler = (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    if (token.user.permissionLevel < UserPermissionLevels.Moderator) {
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.Moderator);
        res.setHeader(`Perms-CurrentLevel`, token.user.permissionLevel);
        return res.sendStatus(401);
    }

    return res.status(200).json(OptOutDatabase.getAll());
};
