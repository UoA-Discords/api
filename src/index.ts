import { EntriesDatabases, UserDatabase } from './classes/Databases';
import { Loggers } from './classes/Loggers';
import { Config } from './global/Config';
import { app } from './server';
import { EntryStates } from './shared/Types/Entries';

// initial logging
{
    // entry information
    const pendingSize = EntriesDatabases[EntryStates.Pending].size;
    const approvedSize = EntriesDatabases[EntryStates.Approved].size;
    const deniedSize = EntriesDatabases[EntryStates.Denied].size;
    const withdrawnSize = EntriesDatabases[EntryStates.Withdrawn].size;

    Loggers.info.log(
        `Registered ${pendingSize} pending, ${approvedSize} approved, ${deniedSize} denied, and ${withdrawnSize} withdrawn entries in 4 databases`,
    );

    // user information
    const usersSize = UserDatabase.size;
    Loggers.info.log(`Registered ${usersSize} users`);
}

// start app
const listener = app.listen(Config.port, () => {
    const addressInfo = listener.address();
    if (typeof addressInfo === `string`) {
        Loggers.info.log(`Listening on ${addressInfo}`);
    } else if (addressInfo === null) {
        Loggers.info.log(`Listening on port NULL, that doesn't seem right`);
    } else {
        Loggers.info.log(
            `Listening on ${addressInfo.address.replace(`::`, `localhost`)}:${addressInfo.port} (${
                addressInfo.family
            })`,
        );
    }
});
