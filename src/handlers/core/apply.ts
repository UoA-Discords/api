import { RequestHandler } from 'express';
import { EntriesDatabases, OptOutDatabase, UserDatabase } from '../../classes/Databases';
import { Loggers } from '../../classes/Loggers';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { validateTagsArray } from '../../functions/validateTagsArray';
import { Config } from '../../global/Config';
import { validateDiscordInvite } from '../../shared/functions';
import { EntryFacultyTags, EntryStates, PendingEntry } from '../../shared/Types/Entries';
import { BasicUserInfo, UserPermissionLevels } from '../../shared/Types/User';

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
        if (token.user.myApplicationStats[EntryStates.Pending] >= 1) {
            return res.status(400).json({
                shortMessage: `Application Limit Reached`,
                longMessage: `You have reached your limit of pending server applications (1).`,
                fixMessage: `Wait for one of your existing applications to get approved.`,
            });
        }
    } else if (token.user.permissionLevel === UserPermissionLevels.Elevated) {
        // elevated = max of 10 pending
        if (token.user.myApplicationStats[EntryStates.Pending] >= 10) {
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

    const inviteValidation = await validateDiscordInvite(
        inviteCode,
        Config.applyRequirements.memberCount,
        Config.applyRequirements.verificationLevel,
        UserDatabase.get,
    );

    if (!inviteValidation.valid) {
        return res.status(400).json({
            shortMessage: `Invalid Invite Code`,
            longMessage: `This invite code is invalid.`,
            fixMessage: `Try again with a valid invite code.`,
        });
    }

    // make sure we dont have this guild in any of our databases already
    {
        for (const _state in EntriesDatabases) {
            const state = Number(_state) as EntryStates;
            if (EntriesDatabases[state].has(inviteValidation.id)) {
                return res.status(400).json({
                    shortMessage: `Already ${EntryStates[state]}`,
                    longMessage: `This server is already registered, with state ${EntryStates[state]} (${state}).`,
                    fixMessage: null,
                });
            }
        }

        if (OptOutDatabase.has(inviteValidation.id)) {
            return res.status(400).json({
                shortMessage: `Opted Out`,
                longMessage: `This server's staff have opted-out of the registry.`,
                fixMessage: `Discuss this with the server's staff.`,
            });
        }
    }

    token.user.myApplicationStats[EntryStates.Pending]++;
    UserDatabase.set(token.user);

    const createdBy: BasicUserInfo = {
        id: token.user.id,
        username: token.user.username,
        discriminator: token.user.discriminator,
        avatar: token.user.avatar,
        permissionLevel: token.user.permissionLevel,
    };

    const newEntry: PendingEntry = {
        id: inviteValidation.id,
        state: EntryStates.Pending,
        inviteCode: inviteCode,
        inviteCreatedBy: inviteValidation.inviteCreatedBy,
        guildData: inviteValidation.guildData,
        memberCountHistory: [[inviteValidation.onlineMembers, inviteValidation.totalMembers]],
        createdBy,
        createdAt: new Date().toISOString(),
        likes: 0,
        facultyTags: tags,
    };

    EntriesDatabases[EntryStates.Pending].set(newEntry);

    Loggers.entries.changes.log(
        `[Pending] ${token.user.username}#${token.user.discriminator} made an application for ${inviteValidation.guildData.name} (code = ${inviteCode})`,
    );

    return res.sendStatus(200);
};
