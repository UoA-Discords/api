import { RequestHandler } from 'express';
import { UserDatabase } from '../../classes/Databases';
import { SiteUser, UserPermissionLevels } from '../../shared/Types/User';

export const getAllStaff: RequestHandler = (_req, res) => {
    const allUsers = UserDatabase.getAll();

    const moderators: SiteUser[] = [];
    const admins: SiteUser[] = [];
    const owners: SiteUser[] = [];

    for (const user of allUsers) {
        if (user.permissionLevel >= UserPermissionLevels.Moderator) {
            if (user.permissionLevel === UserPermissionLevels.Moderator) {
                moderators.push(user);
            } else if (user.permissionLevel === UserPermissionLevels.Administrator) {
                admins.push(user);
            } else owners.push(user);

            const partial = user as Partial<SiteUser>;
            delete partial.ip;
            delete partial.likes;
        }
    }

    return res.status(200).json({ moderators, admins, owners });
};
