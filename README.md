# Getting Started

Before you begin, set up your environment variables. Rename `.env.example` to `.env` and update it with your credentials.

Your `.env` file should look similar to this:

```
FLATFILE_API_KEY="sk_9b31f008af24452b9fb4de465a3cefd6"
FLATFILE_ENVIRONMENT_ID="us_env_D4LJo6BP"
```

The pre-set credentials are pointing to a development only environment and can be used as needed for local development and hosted testing.

## Development

To run the project and develop locally run `yarn dev` or `npx flatfile develop typescript/index.ts` to start a local listener.

## Deployment

To deploy the processing code run `yarn deploy-processor` or `npx flatfile deploy typescript/index.ts`

To deploy the space configuration run `yarn deploy-confifguration` or `npx flatfile deploy typescript/space-configure.ts`


## See all code examples

To see all of the code examples from the docs, head to the [flatfile-docs-kitchen-sink](https://github.com/FlatFilers/flatfile-docs-kitchen-sink) repo.
