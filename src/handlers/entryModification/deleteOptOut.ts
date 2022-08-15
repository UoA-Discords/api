import { RequestHandler } from 'express';
import { OptOutDatabase, UserDatabase } from '../../classes/Databases';
import { Loggers } from '../../classes/Loggers';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { UserPermissionLevels } from '../../shared/Types/User';

export const deleteOptOut: RequestHandler = (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    /** User who is making this request on behalf of the guild's admins or owners. */
    const staffMember = token.user;

    // check user is admin or above
    if (staffMember.permissionLevel < UserPermissionLevels.Administrator) {
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.Administrator);
        res.setHeader(`Perms-CurrentLevel`, staffMember.permissionLevel);
        return res.sendStatus(401);
    }

    // validate request body
    const { guildId } = req.body;

    if (typeof guildId !== `string`) {
        return res.status(400).json({
            shortMessage: `Invalid Request Body`,
            longMessage: `The DELETE request body must have a valid "guildId" key value pair, should be a string.`,
            fixMessage: null,
        });
    }

    const guild = OptOutDatabase.get(guildId);

    if (guild === null) {
        return res.sendStatus(404);
    }

    OptOutDatabase.remove(guild.id);

    const behalfOf = UserDatabase.get(guild.optedOutBy);

    const behalfOfLog =
        behalfOf !== null ? `${behalfOf.username}#${behalfOf.discriminator}` : guild.optedOutBy.toString();

    Loggers.entries.optouts.log(
        `${staffMember.username}#${staffMember.discriminator} removed ${guildId} (added on ${new Date(
            guild.doneAt,
        ).toLocaleDateString(`en-NZ`)} by ${guild.doneBy.username}#${
            guild.doneBy.discriminator
        } on behalf of ${behalfOfLog})`,
    );

    return res.sendStatus(200);
};
