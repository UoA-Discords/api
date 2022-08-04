import { DuplicateLogBehaviour, Logger } from './Template';

const devmode = process.argv.slice(2).includes(`--devmode`);

const behaviour = devmode ? DuplicateLogBehaviour.Replace : DuplicateLogBehaviour.Append;

export const Loggers = {
    error: new Logger(`errors.log`, behaviour, devmode),
    info: new Logger(`info.log`, behaviour, devmode),
    sessions: {
        main: new Logger(`sessions/main.log`, behaviour, devmode),
        state: new Logger(`sessions/states.log`, behaviour, devmode),
    },
};
