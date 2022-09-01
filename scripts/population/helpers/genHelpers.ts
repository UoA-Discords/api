import { randomBytes } from 'crypto';

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

const adjLen = adjectives.length;
export function randomAdjective(): string {
    return adjectives[Math.floor(Math.random() * adjLen)]!;
}

const nounLen = adjectives.length;

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

export function randomNoun(): string {
    return nouns[Math.floor(Math.random() * nounLen)]!;
}

/** Randomly generates a valid Snowflake ID. */
export function randomId(length: number = 18): string {
    const output = new Array<string>(length);

    for (let i = 0; i < length; i++) {
        output[i] = Math.floor(Math.random() * 10).toString();
    }

    return output.join(``);
}

const oldestPossibleDate = new Date(`2021-1-1`).getTime();

/** Randomly generates past date. Can be as old as 1/1/2021 and as recent as Date.now().  */
export function randomDate(mostRecentAllowed: number = Date.now(), oldestAllowed: number = oldestPossibleDate): string {
    const timeDiff = mostRecentAllowed - oldestAllowed;

    const randomAddedTime = Math.floor(Math.random() * (timeDiff + 1));

    return new Date(oldestAllowed + randomAddedTime).toISOString();
}

/** Randomly generates a valid (but potentially restricted, e.g. "255") IP address. */
export function randomIp(): string {
    return new Array(4)
        .fill(null)
        .map(() => randomBytes(1).readUInt8().toString())
        .join(`.`);
}
