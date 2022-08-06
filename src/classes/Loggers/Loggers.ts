import { DuplicateLogBehaviour, Logger } from './Template';

const devmode = process.argv.slice(2).includes(`--devmode`);

const behaviour = devmode ? DuplicateLogBehaviour.Replace : DuplicateLogBehaviour.Append;

export const Loggers = {
    /** General errors, logging here should be reserved for completely unexpected errors. */
    error: new Logger(`errors.log`, behaviour, devmode),
    /** General server information, e.g. "Listening on ip:port (family)" */
    info: new Logger(`info.log`, behaviour, devmode),
    /** Site logins, logouts, and other session-related information. */
    sessions: {
        /** Logins, logouts, and refreshes. */
        main: new Logger(`sessions/main.log`, behaviour, devmode),
        /** Overwritten, expired, fulfilled, and warning state information. */
        state: new Logger(`sessions/states.log`, behaviour, devmode),
    },
    permissionChanges: new Logger(`permissions.log`, behaviour, devmode),
};
