import { RequestHandler } from 'express';
import { UserDatabase } from '../../classes/Databases';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { SiteUser, UserPermissionLevels } from '../../shared/Types/User';

export const getAllUsers: RequestHandler = (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    // check user has permission to get all users
    if (token.user.permissionLevel < UserPermissionLevels.Moderator) {
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.Moderator);
        res.setHeader(`Perms-CurrentLevel`, token.user.permissionLevel);
        return res.sendStatus(401);
    }

    return res.status(200).json(
        UserDatabase.getAll().map((e) => {
            const partial = e as Partial<SiteUser>;
            delete partial.ip;
            delete partial.likes;
            delete partial.dislikes;
            return partial;
        }),
    );
};
