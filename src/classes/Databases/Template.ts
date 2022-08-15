import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';

export class DatabaseManager<T extends { id: string } = { id: string }> {
    /** Full name of folder inside the `data` directory, e.g. "users" or "subfolder/guilds". */
    public readonly fileName: string;

    /** Singular noun to refer to database items as (used in error messages).  */
    public readonly itemName: string;

    /** `data` joined with file name. */
    private readonly _filePath: string;

    /**
     * @param {String} fileName Full name of folder inside the `data` directory, e.g. "users" or "subfolder/guilds".
     * @param {String} itemName Singular noun to refer to database items as (used in error messages).
     */
    public constructor(fileName: string, itemName: string) {
        this.fileName = fileName;
        this._filePath = join(`data`, this.fileName);
        this.itemName = itemName;

        if (!existsSync(this._filePath)) {
            mkdirSync(this._filePath, { recursive: true });
        }
    }

    /** Checks if an entry exists in the database. */
    public has(id: string): boolean {
        if (!DatabaseManager._validId.test(id)) return false;
        return existsSync(join(this._filePath, `${id}.json`));
    }

    private static _validId = new RegExp(/^(TEST_[a-zA-Z]{1,}_)?[0-9]{1,}$/);

    /** Gets an entry from the database. */
    public get(id: string): T | null {
        if (!DatabaseManager._validId.test(id)) return null;
        try {
            return JSON.parse(readFileSync(join(this._filePath, `${id}.json`), `utf-8`));
        } catch (error) {
            return null;
        }
    }

    /** Adds or updates an entry in the database.  */
    public set(...items: T[]): void {
        for (const item of items) {
            writeFileSync(join(this._filePath, `${item.id}.json`), JSON.stringify(item), `utf-8`);
        }
    }

    /** Removes an entry from the database, will error if entry does not exist. */
    public remove(...ids: string[]): void {
        for (const id of ids) {
            rmSync(join(this._filePath, `${id}.json`));
        }
    }

    public get size(): number {
        return readdirSync(this._filePath, `utf-8`).length;
    }

    public getAll(): T[] {
        const allItems = readdirSync(this._filePath, `utf-8`);
        const len = allItems.length;

        const output = new Array<T>(len);
        for (let i = 0; i < len; i++) {
            const fileName = allItems[i]!;
            const fileId = fileName.slice(0, -5); // remove the ".json" extension
            output[i] = this.get(fileId)!;
        }

        return output;
    }
}
