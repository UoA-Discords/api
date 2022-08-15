import { RequestHandler } from 'express';
import { EntriesDatabases } from '../../classes/Databases';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { EntryStates } from '../../shared/Types/Entries';
import { UserPermissionLevels } from '../../shared/Types/User';

export const getEntriesOfState: RequestHandler = (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    if (token.user.permissionLevel < UserPermissionLevels.Moderator) {
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.Moderator);
        res.setHeader(`Perms-CurrentLevel`, token.user.permissionLevel);
        return res.sendStatus(401);
    }

    const { state } = req.params;
    if (state === undefined) {
        return res.status(400).json({
            shortMessage: `Unknown State`,
            longMessage: `An unknown state was specified in the request URL.`,
            fixMessage: null,
        });
    }

    const numState = Number(state) as EntryStates;
    if (EntryStates[numState] === undefined) {
        return res.status(400).json({
            shortMessage: `Invalid State`,
            longMessage: `An invalid state was specified in the request URL. Please specify a value between 0 and ${EntryStates.Withdrawn} (inclusive).`,
            fixMessage: null,
        });
    }

    return res.status(200).json(EntriesDatabases[numState].getAll());
};
