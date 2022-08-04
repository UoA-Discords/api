import { Response } from 'express';

type AllTypes = `undefined` | `object` | `boolean` | `number` | `bigint` | `string` | `symbol` | `function`;

/**
 * Handles displaying an error message if a property in a GET, POST, or other
 * form of HTTP request was missing or of an unexpected type.
 */
export function invalidRequestProperty(
    res: Response,
    propertyName: string,
    location: `body` | `header` | `query`,
    expectedType: AllTypes,
    received: unknown,
): void {
    if (location === `body`) {
        res.status(400).json(`Body "${propertyName}" must be a ${expectedType} (got ${typeof received})`);
    } else if (location === `query`) {
        res.status(400).json(`Query parameter "${propertyName}" must be a ${expectedType} (got ${typeof received})`);
    } else {
        res.status(400).json(`Header "${propertyName}" must be a ${expectedType} (got ${typeof received})`);
    }
}
