import { RequestHandler } from 'express';
import { OptOutDatabase, UserDatabase } from '../../classes/Databases';
import { Loggers } from '../../classes/Loggers';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { UserPermissionLevels } from '../../shared/Types/User';

export const makeOptOut: RequestHandler = (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    /** User who is making this request on behalf of the guild's admins or owners. */
    const staffMember = token.user;

    // check user is moderator or above
    if (staffMember.permissionLevel < UserPermissionLevels.Moderator) {
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.Moderator);
        res.setHeader(`Perms-CurrentLevel`, staffMember.permissionLevel);
        return res.sendStatus(401);
    }

    // validate request body
    const { onBehalfOf, guildId } = req.body;

    if (typeof onBehalfOf !== `string` || typeof guildId !== `string`) {
        return res.status(400).json({
            shortMessage: `Invalid Request Body`,
            longMessage: `The POST request body must have valid "onBehalfOf" and "guildId" key value pairs, both should be strings.`,
            fixMessage: null,
        });
    }

    if (OptOutDatabase.has(guildId)) {
        return res.sendStatus(204);
    }

    OptOutDatabase.set({
        id: guildId,
        optedOutBy: onBehalfOf,
        doneBy: {
            id: staffMember.id,
            username: staffMember.username,
            discriminator: staffMember.discriminator,
            avatar: staffMember.avatar,
            permissionLevel: staffMember.permissionLevel,
        },
        doneAt: new Date().toISOString(),
    });

    const behalfOfUser = UserDatabase.get(onBehalfOf);
    if (behalfOfUser !== null) {
        const { username, discriminator } = behalfOfUser;
        Loggers.entries.optouts.log(
            `${staffMember.username}#${staffMember.discriminator} opted out ${guildId} on behalf of ${username}#${discriminator}`,
        );
    } else {
        Loggers.entries.optouts.log(
            `${staffMember.username}#${staffMember.discriminator} opted out ${guildId} on behalf of ${onBehalfOf}`,
        );
    }

    return res.sendStatus(200);
};
