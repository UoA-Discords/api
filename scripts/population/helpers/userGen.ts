import { BasicUserInfo } from '../../../src/shared/Types/User';
import { randomId } from './genHelpers';

const adjectives = [
    `broken`,
    `expensive`,
    `capricious`,
    `idiotic`,
    `apathetic`,
    `roasted`,
    `sudden`,
    `elastic`,
    `outgoing`,
    `jolly`,
    `chief`,
    `abrasive`,
    `ripe`,
    `quixotic`,
    `tan`,
    `homely`,
    `giant`,
    `wry`,
    `repulsive`,
    `unbiased`,
];

const nouns = [
    `dirt`,
    `candidate`,
    `solution`,
    `inflation`,
    `awareness`,
    `understanding`,
    `growth`,
    `employee`,
    `tale`,
    `painting`,
    `news`,
    `housing`,
    `marriage`,
    `sector`,
    `ratio`,
    `initative`,
    `variation`,
    `editor`,
    `confusion`,
    `grandmother`,
];

const adjLen = adjectives.length;
const nounLen = nouns.length;

/** Randomly generates a full user. */
export function makeRandomUser(): Omit<BasicUserInfo, `permissionLevel`> {
    const randomAdjIndex = Math.floor(Math.random() * adjLen);
    const randomNounIndex = Math.floor(Math.random() * nounLen);

    const username =
        adjectives[randomAdjIndex]! +
        nouns[randomNounIndex]!.slice(0, 1).toUpperCase() +
        nouns[randomNounIndex]!.slice(1);
    const discriminator = randomAdjIndex.toString().padStart(2, `0`) + randomNounIndex.toString().padStart(2, `0`);

    const id = randomId();

    return {
        username,
        discriminator,
        id,
        avatar: null,
    };
}
