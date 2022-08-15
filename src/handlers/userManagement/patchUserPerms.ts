import { RequestHandler } from 'express';
import { UserDatabase } from '../../classes/Databases';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { SiteUser, UserPermissionLevels } from '../../shared/Types/User';

export const patchUserPerms: RequestHandler = (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    /** User who is performing the change. */
    const sourceUser = token.user;

    /** User who is geting their permission level changed. */
    let targetUser: SiteUser;

    let newPermissionLevel: UserPermissionLevels;

    // check source user is admin
    if (sourceUser.permissionLevel < UserPermissionLevels.Administrator) {
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.Administrator);
        res.setHeader(`Perms-CurrentLevel`, sourceUser.permissionLevel);
        return res.sendStatus(401);
    }

    // check target user exists
    {
        const { id: targetUserId } = req.params;
        if (targetUserId === undefined) return res.sendStatus(404);
        const user = UserDatabase.get(targetUserId);
        if (user === null) return res.sendStatus(404);
        targetUser = user;
    }

    // check source !== target
    if (targetUser.id === sourceUser.id) {
        return res.status(400).json({
            shortMessage: `Invalid Target User`,
            longMessage: `You cannot (attempt to) change your own permission level. This wouldn't work even if this check wasn't in place, since you need to be at least 1 level above the target user.`,
            fixMessage: `Try again with a valid target user.`,
        });
    }

    // validate new permission level
    {
        newPermissionLevel = req.body[`newPermissionLevel`];
        if (
            typeof newPermissionLevel !== `number` ||
            !Number.isInteger(newPermissionLevel) ||
            newPermissionLevel < 0 ||
            newPermissionLevel >= UserPermissionLevels.Owner
        ) {
            return res.status(400).json({
                shortMessage: `Invalid New Permission Level`,
                longMessage: `The permission level you specified either wasn't an integer, or didn't lie within the valid range (0 to ${UserPermissionLevels.Owner} exclusive).`,
                fixMessage: `Try again with a valid permission level.`,
            });
        }
    }

    // check source user is higher permission level than target
    if (sourceUser.permissionLevel <= targetUser.permissionLevel) {
        res.setHeader(`Perms-RequiredLevel`, targetUser.permissionLevel + 1);
        res.setHeader(`Perms-CurrentLevel`, sourceUser.permissionLevel);
        return res.sendStatus(401);
    }

    // check source user will still be higher after change
    if (sourceUser.permissionLevel <= newPermissionLevel) {
        res.setHeader(`Perms-RequiredLevel`, newPermissionLevel + 1);
        res.setHeader(`Perms-CurrentLevel`, sourceUser.permissionLevel);
        return res.sendStatus(401);
    }

    targetUser.permissionLevel = newPermissionLevel;
    UserDatabase.set(targetUser);

    return res.sendStatus(200);
};
