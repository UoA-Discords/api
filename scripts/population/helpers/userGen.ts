import { BasicUserInfo } from '../../../src/shared/Types/User';
import { randomNoun, randomAdjective, randomId, capitalize } from './genHelpers';

/** Randomly generates a full user. */
export function makeRandomUser(): Omit<BasicUserInfo, `permissionLevel`> {
    const usernameNoun = randomNoun();

    const username = randomAdjective() + capitalize(usernameNoun);
    const discriminator = randomId(4);
    const id = randomId();

    return {
        username,
        discriminator,
        id,
        avatar: null,
    };
}
