import { RequestHandler } from 'express';
import { UserDatabase } from '../../classes/Databases';
import { removeUserData } from '../../functions/removeUserData';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { UserPermissionLevels } from '../../shared/Types/User';

export const getUserById: RequestHandler = (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    const { id } = req.params;
    if (id === undefined) return res.sendStatus(400);

    if (token.user.permissionLevel < UserPermissionLevels.Moderator) {
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.Moderator);
        res.setHeader(`Perms-CurrentLevel`, token.user.permissionLevel);
        return res.sendStatus(401);
    }

    const user = UserDatabase.get(id);

    if (user === null) return res.sendStatus(404);

    removeUserData(user, token.user.permissionLevel);

    return res.status(200).json(user);
};
