# UoA-Discords/API

Backend API for the UoA Discords project.

[![CodeQL](https://github.com/UoA-Discords/api/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/UoA-Discords/api/actions/workflows/codeql-analysis.yml)
[![Deploy](https://github.com/UoA-Discords/api/actions/workflows/deploy.yml/badge.svg)](https://github.com/UoA-Discords/api/actions/workflows/deploy.yml)
[![Node.js CI](https://github.com/UoA-Discords/api/actions/workflows/node.js.yml/badge.svg)](https://github.com/UoA-Discords/api/actions/workflows/node.js.yml)

## Installation

Make sure you have the following dependencies installed:

-   [NodeJS](https://nodejs.org/), any version >= 16 should work. Lower versions have not been tested.

-   [yarn](https://yarnpkg.com/) (can be installed using `npm i -g yarn`), not strictly required but strongly recommended (and some scripts may not work without it).

-   [git](https://git-scm.com/), should be installed already (via NodeJS).

1. First make a [Discord Application](https://discord.com/developers/applications)

    - Go to the `OAuth2` > `General` section
    - Note down your **client ID** and **client secret**
    - Add a redirect URL (this can be anything), you'll need it for Discord login requests later

2. Now you can run the following in a terminal:

```sh
git clone https://github.com/UoA-Discords/api.git uoa-discords-api
cd uoa-discords-api
git submodule init
git submodule update
yarn install # or npm install
yarn build # or npm run build
cp config.example.json config.json
```

3. Next fill out config values with your Discord **client ID** and **client secret** from step 1

    - Fill out any other values that might need changing, you can see their descriptions [here](./src/global/Config.ts)

You can now run the API using `node .` or `yarn start` in a terminal.

## Script Reference

-   `yarn dev` Starts the application with hot-reloading enabled.
-   `yarn start` Starts the production-ready build of the application.
-   `yarn lint` Runs eslint and Prettier linting rules on the source files.
-   `yarn build` Creates a production-ready build in the **build/** directory.
-   `yarn typecheck` Runs TSC typechecking on the source files.
-   `yarn check:config` Validates your **config.json** and **config.example.json** file with the expected interface.
-   `yarn test` Runs Jest testing on the application.
-   `yarn check-all` Runs linting, typechecking, and testing.
-   `yarn integrity:*` Runs custom scripts for checking validity of data in the **data/** directory.
-   `yarn populate` Runs custom scripts for populating the database with fake (but valid) values.
