import * as Sentire from 'sentire';
import * as FluentLogger from 'fluent-logger';

export interface IFluentTransport extends Sentire.ITransport {

}

export interface IFluentTransportOptions extends Sentire.ITransportOptions {
    tag: string;
    host: string;
    port?: number;
    timeout?: number;

    tagLevel?: boolean;
}

export class FluentTransport extends Sentire.ATransport implements IFluentTransport {
    public readonly tagLevel: boolean;

    private readonly fluentLogger: FluentLogger.FluentLogger;

    constructor(name: string, options: IFluentTransportOptions) {
        super(name, options);

        this.tagLevel = options.tagLevel || false;

        this.fluentLogger = FluentLogger.createFluentSender(options.tag, {
            host: options.host,
            port: options.port,
            timeout: options.timeout
        });
        this.fluentLogger.on('error', (err) => {
            console.error(`Fluentd error: ${err.message}`);
        });
    }

    public log(message: string, metadata: Sentire.ITransportMetadata) {
        return new Promise<void>((resolve, reject) => {
            if (this.tagLevel) {
                this.fluentLogger.emit(metadata.level, { ...metadata, message }, (err) => {
                    if (err) return reject(err);

                    resolve();
                });
            }
            else {
                this.fluentLogger.emit({ ...metadata, message }, (err) => {
                    if (err) return reject(err);

                    resolve();
                });
            }
        });
    }
}