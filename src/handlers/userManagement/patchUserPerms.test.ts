import { RESTPostOAuth2AccessTokenResult } from 'discord-api-types/v10';
import request from 'supertest';
import { UserDatabase } from '../../classes/Databases';
import { makeSiteToken } from '../../functions/siteTokenFunctions';
import { Config } from '../../global/Config';
import { app } from '../../server';
import { SiteUser, UserPermissionLevels } from '../../shared/Types/User';

describe(`patchUserPerms`, () => {
    const defaultUser = { id: `TEST_PatchUserPerms_0`, permissionLevel: UserPermissionLevels.Default } as SiteUser;
    const adminUser = { id: `TEST_PatchUserPerms_1`, permissionLevel: UserPermissionLevels.Administrator } as SiteUser;
    const ownerUser = { id: `TEST_PatchUserPerms_2`, permissionLevel: UserPermissionLevels.Owner } as SiteUser;

    const _makeSiteToken = (id: string) => {
        const authData = {
            access_token: ``,
            refresh_token: ``,
            expires_in: 60480,
        } as RESTPostOAuth2AccessTokenResult;
        return makeSiteToken(authData, id);
    };

    const defaultUserToken = _makeSiteToken(defaultUser.id);
    const adminUserToken = _makeSiteToken(adminUser.id);

    beforeAll(() => {
        UserDatabase.set(defaultUser, ownerUser, adminUser);
    });

    afterAll(() => {
        UserDatabase.remove(defaultUser.id, ownerUser.id, adminUser.id);
    });

    it(`Should not allow any actions by users below admin level`, async () => {
        const response = await request(app)
            .patch(`/users/${defaultUser.id}/perms`)
            .send({
                newPermissionLevel: 0,
            })
            .set(`Authorization`, `Bearer ${defaultUserToken}`)
            .set(`RateLimit-Bypass-Token`, Config.rateLimitBypassTokens[0] || ``);
        expect(response.statusCode).toBe(401);
        expect(response.headers[`perms-requiredlevel`]).toBe(UserPermissionLevels.Administrator.toString());
        expect(response.headers[`perms-currentlevel`]).toBe(defaultUser.permissionLevel.toString());
    });

    it(`Should not allow actions on non-existent users`, async () => {
        const response = await request(app)
            .patch(`/users/TEST_NEVER/perms`)
            .send({
                newPermissionLevel: 0,
            })
            .set(`Authorization`, `Bearer ${adminUserToken}`)
            .set(`RateLimit-Bypass-Token`, Config.rateLimitBypassTokens[0] || ``);
        expect(response.statusCode).toBe(404);
    });

    it(`Should not allow actions on self`, async () => {
        const response = await request(app)
            .patch(`/users/${adminUser.id}/perms`)
            .send({
                newPermissionLevel: 0,
            })
            .set(`Authorization`, `Bearer ${adminUserToken}`)
            .set(`RateLimit-Bypass-Token`, Config.rateLimitBypassTokens[0] || ``);
        expect(response.statusCode).toBe(400);
    });

    it(`Should not allow setting new levels outside the valid range`, async () => {
        const response = await request(app)
            .patch(`/users/${defaultUser.id}/perms`)
            .send({
                newPermissionLevel: UserPermissionLevels.Owner + 1,
            })
            .set(`Authorization`, `Bearer ${adminUserToken}`)
            .set(`RateLimit-Bypass-Token`, Config.rateLimitBypassTokens[0] || ``);
        expect(response.statusCode).toBe(400);
    });

    it(`Should not allow changing users >= permission level of the patcher`, async () => {
        const response = await request(app)
            .patch(`/users/${ownerUser.id}/perms`)
            .send({
                newPermissionLevel: 0,
            })
            .set(`Authorization`, `Bearer ${adminUserToken}`)
            .set(`RateLimit-Bypass-Token`, Config.rateLimitBypassTokens[0] || ``);
        expect(response.statusCode).toBe(401);
        expect(response.headers[`perms-requiredlevel`]).toBe((ownerUser.permissionLevel + 1).toString());
        expect(response.headers[`perms-currentlevel`]).toBe(adminUser.permissionLevel.toString());
    });

    it(`Should not allow new permission level to be >= permission level of the patcher`, async () => {
        const response = await request(app)
            .patch(`/users/${defaultUser.id}/perms`)
            .send({
                newPermissionLevel: UserPermissionLevels.Administrator,
            })
            .set(`Authorization`, `Bearer ${adminUserToken}`)
            .set(`RateLimit-Bypass-Token`, Config.rateLimitBypassTokens[0] || ``);
        expect(response.statusCode).toBe(401);
        expect(response.headers[`perms-requiredlevel`]).toBe((UserPermissionLevels.Administrator + 1).toString());
        expect(response.headers[`perms-currentlevel`]).toBe(adminUser.permissionLevel.toString());
    });

    it(`Should otherwise modify permission level`, async () => {
        const response = await request(app)
            .patch(`/users/${defaultUser.id}/perms`)
            .send({
                newPermissionLevel: UserPermissionLevels.Moderator,
            })
            .set(`Authorization`, `Bearer ${adminUserToken}`)
            .set(`RateLimit-Bypass-Token`, Config.rateLimitBypassTokens[0] || ``);
        expect(response.statusCode).toBe(200);

        expect(UserDatabase.get(defaultUser.id)!.permissionLevel).toBe(UserPermissionLevels.Moderator);
    });
});
