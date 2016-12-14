import 'reflect-metadata';

import * as Bluebird from 'bluebird';

// Promisify fs-extra module and augment typescript definition
import * as FS from 'fs-extra';
Bluebird.promisifyAll(FS);
declare module 'fs-extra' {
    export function ensureFileAsync(path: string): Promise<void>;
    export function ensureDirAsync(path: string): Promise<void>;
    export function readFileAsync(path: string, encoding?: string): Promise<string>;
    export function readJsonAsync(path: string): Promise<any>;
    export function writeJsonAsync(path: string, object: any): Promise<any>;
    export function outputJsonAsync(path: string, object: any): Promise<any>;
}

export * from './lib/transport';