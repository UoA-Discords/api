import { BasicUserInfo } from '../../../src/shared/Types/User';
import { randomNoun, randomAdjective, randomId } from './genHelpers';

/** Randomly generates a full user. */
export function makeRandomUser(): Omit<BasicUserInfo, `permissionLevel`> {
    const usernameNoun = randomNoun();

    const username = randomAdjective() + usernameNoun.slice(0, 1).toUpperCase() + usernameNoun.slice(1);
    const discriminator = randomId(4);
    const id = randomId();

    return {
        username,
        discriminator,
        id,
        avatar: null,
    };
}
