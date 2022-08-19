import { RESTPostOAuth2AccessTokenResult } from 'discord-api-types/v10';
import request from 'supertest';
import { UserDatabase } from '../../classes/Databases';
import { removeUserData } from '../../functions/removeUserData';
import { makeSiteToken } from '../../functions/siteTokenFunctions';
import { Config } from '../../global/Config';
import { app } from '../../server';
import { EntryStates } from '../../shared/Types/Entries';
import { SiteUser, UserPermissionLevels } from '../../shared/Types/User';

describe(`getUserById`, () => {
    const defaultUser: SiteUser = {
        id: `TEST_GetUserById_0`,
        permissionLevel: UserPermissionLevels.Default,
        ip: ``,
        firstLogin: ``,
        lastLogin: ``,
        myApplicationStats: {
            [EntryStates.Pending]: 0,
            [EntryStates.Approved]: 0,
            [EntryStates.Denied]: 0,
            [EntryStates.Withdrawn]: 0,
        },
        myAdminStats: {
            [EntryStates.Approved]: 0,
            [EntryStates.Denied]: 0,
            [EntryStates.Withdrawn]: 0,
        },
        likes: [],
        dislikes: [],
        username: ``,
        discriminator: ``,
        avatar: null,
    };
    const moderatorUser = { id: `TEST_GetUserById_1`, permissionLevel: UserPermissionLevels.Moderator } as SiteUser;
    const adminUser = { id: `TEST_GetUserById_2`, permissionLevel: UserPermissionLevels.Administrator } as SiteUser;

    const _makeSiteToken = (id: string) => {
        const authData = {
            access_token: ``,
            refresh_token: ``,
            expires_in: 60480,
        } as RESTPostOAuth2AccessTokenResult;
        return makeSiteToken(authData, id);
    };

    const defaultUserToken = _makeSiteToken(defaultUser.id);
    const moderatorUserToken = _makeSiteToken(moderatorUser.id);
    const adminUserToken = _makeSiteToken(adminUser.id);

    beforeAll(() => {
        UserDatabase.set(defaultUser, moderatorUser, adminUser);
    });

    afterAll(() => {
        UserDatabase.remove(defaultUser.id, moderatorUser.id, adminUser.id);
    });

    it(`Should 401 for users below moderator level`, async () => {
        const response = await request(app)
            .get(`/users/TEST_GetUserById_999`)
            .send()
            .set(`Authorization`, `Bearer ${defaultUserToken}`)
            .set(`RateLimit-Bypass-Token`, Config.rateLimitBypassTokens[0] || ``);

        expect(response.statusCode).toBe(401);
    });

    it(`Should 404 for a user that does not exist`, async () => {
        const response = await request(app)
            .get(`/users/TEST_GetUserById_999`)
            .send()
            .set(`Authorization`, `Bearer ${moderatorUserToken}`)
            .set(`RateLimit-Bypass-Token`, Config.rateLimitBypassTokens[0] || ``);

        expect(response.statusCode).toBe(404);
    });

    it(`Should 200 for a user that does exist`, async () => {
        const response = await request(app)
            .get(`/users/${defaultUser.id}`)
            .send()
            .set(`Authorization`, `Bearer ${adminUserToken}`)
            .set(`RateLimit-Bypass-Token`, Config.rateLimitBypassTokens[0] || ``);

        expect(response.statusCode).toBe(200);

        removeUserData(defaultUser, adminUser.permissionLevel);
        expect(response.body).toEqual(defaultUser);
    });
});
