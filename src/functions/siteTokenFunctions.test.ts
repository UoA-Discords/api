import { RESTPostOAuth2AccessTokenResult } from 'discord-api-types/rest/v10/oauth2';
import { UserDatabase } from '../classes/Databases';
import { SiteUser } from '../shared/Types/User';
import { makeSiteToken, validateSiteToken } from './siteTokenFunctions';

describe(`siteTokenFunctions`, () => {
    const userA = { id: `TEST_SiteTokenFunctions_0` } as SiteUser;
    const userB = { id: `TEST_SiteTokenFunctions_1` } as SiteUser;

    const _makeSiteToken = (id: string) => {
        const authData = {
            access_token: ``,
            refresh_token: ``,
            expires_in: 60480,
        } as RESTPostOAuth2AccessTokenResult;
        return makeSiteToken(authData, id);
    };

    const userAToken = _makeSiteToken(userA.id);
    const userBToken = _makeSiteToken(userB.id);
    const unknownUserToken = _makeSiteToken(`TEST_SiteTokenFunctions_2`);

    beforeAll(() => {
        UserDatabase.set(userA, userB);
    });

    afterAll(() => {
        UserDatabase.remove(userA.id, userB.id);
    });

    it(`succeeds for valid tokens`, () => {
        const resA = validateSiteToken(userAToken);
        const resB = validateSiteToken(`Bearer ${userBToken}`);

        if (resA.valid === false || resB.valid === false) {
            fail(`Both results should be valid`);
        }

        expect(resA.user.id).toBe(userA.id);
        expect(resB.user.id).toBe(userB.id);
    });

    it(`fails for unknown user tokens`, () => {
        const res = validateSiteToken(unknownUserToken);

        if (res.valid) {
            fail(`Should be invalid`);
        }

        expect(res.reason.shortMessage?.toLowerCase()).toContain(`unrecognized`);
    });
});
