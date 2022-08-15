import { RequestHandler } from 'express';
import { EntriesDatabases, UserDatabase } from '../../classes/Databases';
import { validateSiteToken } from '../../functions/siteTokenFunctions';
import { EntryStates } from '../../shared/Types/Entries';
import { UserPermissionLevels } from '../../shared/Types/User';

export const likeEntry: RequestHandler = (req, res) => {
    const token = validateSiteToken(req.get(`Authorization`));

    if (!token.valid) {
        return res.status(400).json(token.reason);
    }

    if (token.user.permissionLevel < UserPermissionLevels.LikeDislike) {
        res.setHeader(`Perms-RequiredLevel`, UserPermissionLevels.LikeDislike);
        res.setHeader(`Perms-CurrentLevel`, token.user.permissionLevel);
        return res.sendStatus(401);
    }

    const { id } = req.params;
    if (id === undefined) {
        return res.status(400).json({
            shortMessage: `Unknown ID`,
            longMessage: `An unknown ID was specified in the request URL.`,
            fixMessage: null,
        });
    }

    const like = req.body[`like`] as -1 | 0 | 1;
    if (typeof like !== `number` || !Number.isInteger(like) || like < -1 || like > 1) {
        return res.status(400).json({
            shortMessage: `Invalid Like`,
            longMessage: `The "like" request body must be an integer value of -1 (dislike), 0 (neutral), or 1 (like).`,
            fixMessage: null,
        });
    }

    const entry = EntriesDatabases[EntryStates.Approved].get(id);

    if (entry === null) {
        return res.sendStatus(404);
    }

    const likeIndex = token.user.likes.indexOf(entry.id);
    const dislikeIndex = token.user.dislikes.indexOf(entry.id);

    switch (like) {
        case -1: // dislike
            if (dislikeIndex !== -1) {
                // already disliked
                return res.sendStatus(200);
            }

            token.user.dislikes.push(entry.id);
            entry.dislikes++;

            if (likeIndex !== -1) {
                token.user.likes.splice(likeIndex, 1);
                entry.likes--;
            }
            break;
        case 0: // neutral
            if (dislikeIndex !== -1 && likeIndex !== -1) {
                // already neutral
                return res.sendStatus(200);
            }

            if (likeIndex !== -1) {
                // remove like if present
                token.user.likes.splice(likeIndex, 1);
                entry.likes--;
            }
            if (dislikeIndex !== -1) {
                // remove dislike if present
                token.user.dislikes.splice(dislikeIndex, 1);
                entry.dislikes--;
            }
            break;
        case 1: //like
            if (likeIndex !== -1) {
                // already liked
                return res.sendStatus(200);
            }

            token.user.likes.push(entry.id);
            entry.likes++;

            if (dislikeIndex !== -1) {
                token.user.dislikes.splice(dislikeIndex, 1);
                entry.dislikes--;
            }
            break;
    }

    UserDatabase.set(token.user);

    EntriesDatabases[EntryStates.Approved].set(entry);

    return res.sendStatus(200);
};
