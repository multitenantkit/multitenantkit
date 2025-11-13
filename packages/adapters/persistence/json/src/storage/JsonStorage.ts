import { promises as fs } from 'fs';
import { dirname } from 'path';

/**
 * Simple JSON file storage utility
 * Handles reading/writing JSON files with error handling
 */
export class JsonStorage<T> {
    constructor(private readonly filePath: string) {}

    async read(): Promise<T[]> {
        try {
            const data = await fs.readFile(this.filePath, 'utf-8');
            return JSON.parse(data);
        } catch (error: any) {
            // If file doesn't exist, return empty array
            if (error.code === 'ENOENT') {
                return [];
            }
            throw new Error(`Failed to read JSON file ${this.filePath}: ${error.message}`);
        }
    }

    async write(data: T[]): Promise<void> {
        try {
            // Ensure directory exists
            await fs.mkdir(dirname(this.filePath), { recursive: true });

            // Write with pretty formatting for development
            const jsonString = JSON.stringify(data, null, 2);
            await fs.writeFile(this.filePath, jsonString, 'utf-8');
        } catch (error: any) {
            throw new Error(`Failed to write JSON file ${this.filePath}: ${error.message}`);
        }
    }

    async update(updateFn: (data: T[]) => T[]): Promise<void> {
        const data = await this.read();
        const updatedData = updateFn(data);
        await this.write(updatedData);
    }

    async findOne(predicate: (item: T) => boolean): Promise<T | null> {
        const data = await this.read();
        return data.find(predicate) || null;
    }

    async findMany(predicate?: (item: T) => boolean): Promise<T[]> {
        const data = await this.read();
        return predicate ? data.filter(predicate) : data;
    }

    async exists(predicate: (item: T) => boolean): Promise<boolean> {
        const data = await this.read();
        return data.some(predicate);
    }

    async count(predicate?: (item: T) => boolean): Promise<number> {
        const data = await this.read();
        return predicate ? data.filter(predicate).length : data.length;
    }
}
