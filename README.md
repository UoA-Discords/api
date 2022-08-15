# Uoa-Discords/API

Backend API for the UoA Discords project.

[![CodeQL](https://github.com/UoA-Discords/api/actions/workflows/codeql-analysis.yml/badge.svg)](https://github.com/UoA-Discords/api/actions/workflows/codeql-analysis.yml)
[![Deploy](https://github.com/UoA-Discords/api/actions/workflows/deploy.yml/badge.svg)](https://github.com/UoA-Discords/api/actions/workflows/deploy.yml)
[![Node.js CI](https://github.com/UoA-Discords/api/actions/workflows/node.js.yml/badge.svg)](https://github.com/UoA-Discords/api/actions/workflows/node.js.yml)

## Installation

1. Make a [Discord Application](https://discord.com/developers/applications)
    - Go to the `OAuth2` > `General` section
    - Note down your **client ID** and **client secret**
    - Add a redirect URL (this can be anything), you'll need it for Discord login requests later
1. Clone this repository
    ```sh
    git clone https://github.com/UoA-Discords/api.git
    ```
1. Make sure you have NodeJS
    ```sh
    node -v
    ```
    Get it [here](https://nodejs.org/).
1. Install dependencies using [yarn](https://yarnpkg.com/) or npm

    ```sh
    yarn
    ```

    ```sh
    npm install
    ```

1. Make a [config.json](./config.json) file in the root directory
    ```sh
    cp config.example.json config.json
    ```
1. Fill out config values with your Discord **client ID** and **client secret** from step 1.
    - Fill out any other values that might need changing, you can see their descriptions [here](./src/global/Config.ts).
1. Start the API in development mode using the **dev** script

    ```sh
    yarn dev
    ```

    ```sh
    npm run dev
    ```

1. Make a production build using the **build** script

    ```sh
    yarn build
    ```

    ```sh
    npm run build
    ```

1. Start the API in production mode using the **start** script

    ```sh
    node .
    ```

    ```sh
    yarn start
    ```

    ```sh
    npm run start
    ```
