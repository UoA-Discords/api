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
    },
    /** Changing of permission levels. */
    permissionChanges: new Logger(`permissions.log`, behaviour, devmode),
    entries: {
        /** Applications, approvals, denials, and withdrawals. */
        changes: new Logger(`entries/changes.log`, behaviour, devmode),
        /** Opt-out requests. */
        optouts: new Logger(`entries/optouts.log`, behaviour, devmode),
    },
};
