import { SiteUser, UserPermissionLevels } from '../shared/Types/User';

/**
 * Selectively removes data from a SiteUser object based on the requesting user's permission level.
 *
 * This mutates the original object, and does not return a new one.
 */
export function removeUserData(user: SiteUser, permissionLevel: UserPermissionLevels): void {
    const partial = user as Partial<SiteUser>;

    if (permissionLevel < UserPermissionLevels.Owner) {
        delete partial.ip;

        if (permissionLevel < UserPermissionLevels.Administrator) {
            delete partial.likes;
        }
    }
}
