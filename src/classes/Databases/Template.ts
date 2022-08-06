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
        return existsSync(join(this._filePath, `${id}.json`));
    }

    /** Gets an entry from the database, will error if entry does not exist. */
    public get(id: string): T {
        return JSON.parse(readFileSync(join(this._filePath, `${id}.json`), `utf-8`));
    }

    /** Adds or updates an entry in the database.  */
    public set(item: T): void {
        return writeFileSync(join(this._filePath, `${item.id}.json`), JSON.stringify(item), `utf-8`);
    }

    /** Removes an entry from the database, will error if entry does not exist. */
    public remove(id: string): void {
        return rmSync(join(this._filePath, `${id}.json`));
    }

    public get size(): number {
        return readdirSync(this._filePath, `utf-8`).length;
    }
}
