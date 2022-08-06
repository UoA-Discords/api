import { Request, Response } from 'express';
import { UserDatabase } from '../../classes/Databases';
import { Loggers } from '../../classes/Loggers';
import { invalidRequestProperty } from '../../functions/invalidRequestProperty';
import { unknownErrorResponse } from '../../functions/unknownErrorResponse';
import { getUserInfo } from '../../shared/DiscordAPI';
import { permissionLevelToString } from '../../shared/functions';
import { SiteUser, UserPermissionLevels } from '../../shared/Types/User';
import { extractUserId } from './extractUserId';

function logChangeAttempt(
    sourceUser: SiteUser,
    targetUser: SiteUser,
    newLevel: UserPermissionLevels,
    failureReason?: string,
): void {
    let prefix;
    let suffix;
    let verb;
    if (failureReason === undefined) {
        prefix = `Success`;
        suffix = ``;
        verb = `changed`;
    } else {
        prefix = `Fail`;
        suffix = ` (${failureReason})`;
        verb = `attempted`;
    }

    const userA = `${sourceUser.username}#${sourceUser.discriminator} (${sourceUser.id}) [${sourceUser.permissionLevel}]`;
    const userB = `${targetUser.username}#${targetUser.discriminator} (${targetUser.id}) [${targetUser.permissionLevel} -> ${newLevel}]`;

    Loggers.permissionChanges.log(`[${prefix}] ${userA} ${verb} ${userB}${suffix}`);
}

export async function patchUserPermissionLevel(req: Request, res: Response): Promise<void> {
    try {
        /** User to update permissions of. */
        let targetUser: SiteUser;

        /** User who is updating permissions of target. */
        let sourceUser: SiteUser;

        /** Level target should be changed to. */
        let targetPermissionLevel: UserPermissionLevels;

        // validating target
        {
            const targetId = extractUserId(req, res);
            if (targetId === undefined) return;
            targetUser = UserDatabase.get(targetId);
        }

        // validating source
        {
            const { access_token } = req.body;
            if (typeof access_token !== `string`) {
                return invalidRequestProperty(res, `access_token`, `body`, `string`, access_token);
            }
            const { id: sourceId } = await getUserInfo(access_token);
            if (!UserDatabase.has(sourceId)) {
                Loggers.error.log(
                    `Registered access token but no user in database, this should never happen! IP=${req.ip}`,
                );
                res.status(500).json(`You are not registered in the user database`);
                return;
            }
            sourceUser = UserDatabase.get(sourceId);
        }

        // error message if source doesn't have "change levels" perm
        if (sourceUser.permissionLevel < UserPermissionLevels.Administrator) {
            res.status(401).json(
                `You must be permission level ${UserPermissionLevels.Administrator} (${permissionLevelToString(
                    UserPermissionLevels.Administrator,
                    false,
                )}) or higher to change other user's permission levels, currently permission level ${
                    sourceUser.permissionLevel
                } (${permissionLevelToString(sourceUser.permissionLevel, false)})`,
            );
            return;
        }

        // custom error message for same source and target
        if (sourceUser.id === targetUser.id) {
            res.status(400).json(`Cannot update permissions for yourself`);
            return;
        }

        // validating target permission level
        {
            const { new_level } = req.body;
            if (typeof new_level !== `number`) {
                return invalidRequestProperty(res, `new_level`, `body`, `number`, new_level);
            }
            if (UserPermissionLevels[new_level] === undefined) {
                res.status(400).json(
                    `Please specify a valid new level (0 to ${sourceUser.permissionLevel}, exclusive)`,
                );
                return;
            }
            targetPermissionLevel = new_level;
        }

        // error message if permission level would not change
        if (targetUser.permissionLevel === targetPermissionLevel) {
            res.status(400).json(
                `${targetUser.username}#${targetUser.discriminator} is already permission level ${targetPermissionLevel}`,
            );
            return;
        }

        // error message if source does not outrank target
        if (sourceUser.permissionLevel <= targetUser.permissionLevel) {
            logChangeAttempt(sourceUser, targetUser, targetPermissionLevel, `outranked`);
            res.status(401).json(
                `You need to be higher than the permission level of ${targetUser.username} (${
                    targetUser.permissionLevel
                } [${permissionLevelToString(
                    targetUser.permissionLevel,
                    false,
                )}]) to change their permission level, currently permission level ${
                    sourceUser.permissionLevel
                } (${permissionLevelToString(sourceUser.permissionLevel, false)})`,
            );
            return;
        }

        // error message if source does not outrank the new permission level
        if (sourceUser.permissionLevel <= targetPermissionLevel) {
            logChangeAttempt(sourceUser, targetUser, targetPermissionLevel, `too high`);
            res.status(401).json(
                `You can only increase the permission level of users up to (but not including) your permission level (${
                    sourceUser.permissionLevel
                } [${permissionLevelToString(sourceUser.permissionLevel, false)}])`,
            );
            return;
        }

        logChangeAttempt(sourceUser, targetUser, targetPermissionLevel);

        const prevLevel = targetUser.permissionLevel;
        targetUser.permissionLevel = targetPermissionLevel;
        UserDatabase.set(targetUser);

        res.status(200).json(
            `Updated permission level of ${targetUser.username}#${
                targetUser.discriminator
            } from ${permissionLevelToString(prevLevel, true)} to ${permissionLevelToString(
                targetPermissionLevel,
                true,
            )}`,
        );
    } catch (error) {
        return unknownErrorResponse(req, res, error);
    }
}
