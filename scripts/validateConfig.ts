import { GuildVerificationLevel } from 'discord-api-types/v10';
import { existsSync } from 'fs';
import { IConfig } from '../src/global/Config';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const exampleConfig = require(`../config.example.json`);

const _fakeConfig: Omit<IConfig, `version` | `startedAt`> = {
    port: 0,
    discordClientID: ``,
    discordClientSecret: ``,
    discordRedirectURI: ``,
    rateLimitBypassTokens: [],
    maxRequestsPerMinute: 0,
    numProxies: 0,
    applyRequirements: {
        memberCount: 0,
        verificationLevel: GuildVerificationLevel.None,
    },
    jwtSecret: ``,
};

const fakeConfig = _fakeConfig as unknown as Record<string, unknown>;

function recursivelyCompareObjects(
    target: Record<string, unknown>,
    ideal: Record<string, unknown>,
    targetName: string,
): boolean {
    let areEquivalent = true;
    const visitedKeys: Set<string> = new Set();
    for (const key in target) {
        visitedKeys.add(key);
        if (!(key in ideal)) {
            console.log(`key "${key}" is missing from ${targetName}`);
            areEquivalent = false;
        } else if (typeof target[key] !== typeof ideal[key]) {
            console.log(
                `value of "${key}" in ${targetName} is a ${typeof target[key]}, but should be ${typeof ideal[key]}`,
            );
            areEquivalent = false;
        } else if (typeof target[key] === `object`) {
            const valA = target[key] as object;
            const valB = ideal[key] as object;
            if (Array.isArray(valA) || Array.isArray(valB)) {
                if (!Array.isArray(valB)) {
                    console.log(`value of "${key}" in ${targetName} should not be an array `);
                    areEquivalent = false;
                } else if (!Array.isArray(valA)) {
                    console.log(`value of "${key}" in ${targetName} should be an array`);
                    areEquivalent = false;
                }
            } else {
                try {
                    const res = recursivelyCompareObjects(
                        valA as Record<string, unknown>,
                        valB as Record<string, unknown>,
                        `${targetName}[${key}]`,
                    );
                    if (res === false) areEquivalent = false;
                } catch (error) {
                    console.log(`error comparing "${key}" in ${targetName}`);
                    areEquivalent = false;
                }
            }
        }
    }

    for (const key in ideal) {
        if (!visitedKeys.has(key)) {
            console.log(`unrecognized key "${key}" in ${targetName}`);
            areEquivalent = false;
        }
    }
    return areEquivalent;
}

let exitStatus = 0;

if (recursivelyCompareObjects(fakeConfig, exampleConfig, `config.example.json`)) {
    console.log(`✓ config.example.json is valid`);
} else {
    exitStatus = 1;
}

if (existsSync(`config.json`)) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const actualConfig = require(`../config.json`);
    if (recursivelyCompareObjects(fakeConfig, actualConfig, `config.json`)) {
        console.log(`✓ config.json is valid`);
    }
}

process.exit(exitStatus);
