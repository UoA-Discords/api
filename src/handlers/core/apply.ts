import { RequestHandler } from 'express';
import { EntriesDatabases, OptOutDatabase, UserDatabase } from '../../classes/Databases';
import { Loggers } from '../../classes/Loggers';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { validateTagsArray } from '../../functions/validateTagsArray';
import { Config } from '../../global/Config';
import { validateDiscordInvite } from '../../shared/functions';
import { EntryFacultyTags, EntryStates } from '../../shared/Types/Entries';
import { UserPermissionLevels } from '../../shared/Types/User';

export const apply: RequestHandler = async (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    if (token.user.permissionLevel < UserPermissionLevels.Default) {
        // below default = cannot make applications
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.Default);
        res.setHeader(`Perms-CurrentLevel`, token.user.permissionLevel);
        return res.sendStatus(401);
    }
    if (token.user.permissionLevel === UserPermissionLevels.Default) {
        // default = max of 1 pending
        if (token.user.applicationStats.applied >= 1) {
            return res.status(400).json({
                shortMessage: `Application Limit Reached`,
                longMessage: `You have reached your limit of pending server applications (1).`,
                fixMessage: `Wait for one of your existing applications to get approved.`,
            });
        }
    } else if (token.user.permissionLevel === UserPermissionLevels.Elevated) {
        // elevated = max of 10 pending
        if (token.user.applicationStats.applied >= 10) {
            return res.status(400).json({
                shortMessage: `Application Limit Reached`,
                longMessage: `You have reached your limit of pending server applications (10).`,
                fixMessage: `Wait for one of your existing applications to get approved.`,
            });
        }
    }

    const { inviteCode } = req.body;
    const tags = req.body[`tags`] as EntryFacultyTags[];
    if (typeof inviteCode !== `string` || !Array.isArray(tags)) {
        return res.status(400).json({
            shortMessage: `Invalid Request Body`,
            longMessage: `The "inviteCode" must be a string, and "tags" must be an integer array.`,
            fixMessage: null,
        });
    }
    const tagValidation = validateTagsArray(tags);
    if (tagValidation !== true) {
        return res.status(400).json({
            shortMessage: `Invalid Tags`,
            longMessage: tagValidation.join(`\n`),
            fixMessage: `Try again with valid tags.`,
        });
    }

    const inviteValidation = await validateDiscordInvite({
        inviteCode,
        minMemberCount: Config.applyRequirements.memberCount,
        minVerificationLevel: Config.applyRequirements.verificationLevel,
    });

    if (!inviteValidation.valid) {
        return res.status(400).json({
            shortMessage: `Invalid Invite Code`,
            longMessage: `This invite code is invalid.`,
            fixMessage: `Try again with a valid invite code.`,
        });
    }

    const guild = inviteValidation.invite.guild;

    if (EntriesDatabases[EntryStates.Pending].has(guild.id)) {
        return res.status(400).json({
            shortMessage: `Already Applied`,
            longMessage: `An application for this server already exists.`,
            fixMessage: null,
        });
    }
    if (EntriesDatabases[EntryStates.Approved].has(guild.id)) {
        return res.status(400).json({
            shortMessage: `Already Registered`,
            longMessage: `This server is already registered on UoA Discords.`,
            fixMessage: null,
        });
    }
    if (EntriesDatabases[EntryStates.Denied].has(guild.id)) {
        return res.status(400).json({
            shortMessage: `Already Denied`,
            longMessage: `This server has been denied registry from a moderator.`,
            fixMessage: null,
        });
    }
    if (EntriesDatabases[EntryStates.Withdrawn].has(guild.id)) {
        return res.status(400).json({
            shortMessage: `Already Withdrawn`,
            longMessage: `This server has been withdrawn from UoA Discords by a moderator.`,
            fixMessage: null,
        });
    }
    if (OptOutDatabase.has(guild.id)) {
        return res.status(400).json({
            shortMessage: `Opted Out`,
            longMessage: `This server's staff have opted-out of the registry.`,
            fixMessage: `Discuss this with the server's staff.`,
        });
    }

    token.user.applicationStats.applied++;
    UserDatabase.set(token.user);

    EntriesDatabases[EntryStates.Pending].set({
        state: EntryStates.Pending,
        id: guild.id,
        inviteCode: inviteCode,
        guildData: guild,
        memberCountHistory: [],
        createdById: token.user.id,
        createdAt: new Date().toISOString(),
        likes: 0,
        dislikes: 0,
        facultyTags: tags,
    });

    Loggers.entries.changes.log(
        `[Pending] ${token.user.username}#${token.user.discriminator} made an application for ${guild.name} (code = ${inviteCode})`,
    );

    return res.sendStatus(200);
};
