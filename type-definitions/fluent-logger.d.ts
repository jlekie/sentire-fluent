declare module "fluent-logger" {
    export function configure(tagPrefix: string, options: any): void;
    export function createFluentSender(tagPrefix: string, options: IFluentLoggerOptions): FluentLogger;

    export interface IFluentLoggerOptions {
        host?: string;
        port?: number;
        path?: string;
        timeout?: number;
        reconnectInterval?: number;
        requireAckResponse?: boolean;
        ackResponseTimeout?: number;
    }

    export class FluentLogger {
        emit(record: any): void;
        emit(record: any, cb: (err: Error) => void): void;
        emit(record: any, timestamp: number): void;
        emit(record: any, timestamp: number, cb: (err: Error) => void): void;
        emit(label: string, record: any): void;
        emit(label: string, record: any, cb: (err: Error) => void): void;
        emit(label: string, record: any, timestamp: number): void;
        emit(label: string, record: any, timestamp: number, cb: (err: Error) => void): void;
        
        // emit(label: string, record: any, timestamp?: number): void;
        // emit(label: string, record: any, cb?: (err: Error) => void): void;
        // emit(label: string, record: any, timestamp?: number, cb?: (err: Error) => void): void;
        on(eventName: string, cb: (err: Error) => void): this;
    }
}