import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export class DatabaseManager<T extends { id: string } = { id: string }> {
    public readonly fileName: string;
    public readonly itemName: string;

    private readonly _filePath: string;
    protected readonly _data: Record<string, T>;

    public constructor(fileName: string, intialValue: Record<string, T>, itemName: string) {
        this.fileName = fileName;
        this._filePath = join(`data`, this.fileName);
        this.itemName = itemName;

        if (!existsSync(`data`)) {
            mkdirSync(`data`);
        }

        if (!existsSync(this._filePath)) {
            writeFileSync(this._filePath, JSON.stringify(intialValue), `utf-8`);
            this._data = intialValue;
        } else {
            this._data = JSON.parse(readFileSync(this._filePath, `utf-8`));
        }
    }

    protected save(): void {
        writeFileSync(this._filePath, JSON.stringify(this._data), `utf-8`);
    }

    public get(id: string): T | undefined {
        return this._data[id];
    }

    /** @Throws Throws an error if an item with that ID already exists. */
    public add(item: T): void {
        if (this.get(item.id) !== undefined) {
            throw new Error(`${this.itemName} with ID "${item.id}" already exists!`);
        }
        this._data[item.id] = item;
        this.save();
    }

    /** @throws Throws an error if an item with that ID does not exist. */
    public remove(id: string): void {
        if (this.get(id) === undefined) {
            throw new Error(`${this.itemName} with ID "${id}" does not exist!`);
        }
        delete this._data[id];
        this.save();
    }

    /** @throws Throws an error if an item with that ID does not exist. */
    public update(item: T): void {
        if (this.get(item.id) === undefined) {
            throw new Error(`${this.itemName} with ID "${item.id}" does not exist!`);
        }
        this._data[item.id] = item;
        this.save();
    }
}
