# Serverless Slack Webhook

## How To Use

### Requirements

- [Serverless](https://serverless.com/framework/docs/getting-started/)

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/serverless-slack-webhook
cd serverless-slack-webhook
```

Install it and run:

**NPM**

```bash
npm install
npm run dev
```

**Yarn**

```bash
yarn
yarn dev
```

Deploy it to the cloud with [Serverless](https://serverless.com) ([Documentation](https://serverless.com/framework/docs/getting-started/)).

## About Example

This is a simple example showing how to use [Serverless](https://serverless.com) to deploy a function that can add or remove users from Slack channels programatically.

### Configuration

You will need an _Indent Webhook Secret_ for your app. You can get it from the settings of your app in **Configuration for App**. Then, copy the string labeled **Webhook Secret**. This will allow you to verify request payloads from Indent.

The Indent Webhook Secret should then be set as an environment variable. With API Gateway, you likely also need an API secret for Indent to send when making requests to your function.

```bash
INDENT_WEBHOOK_SECRET=SUPER_SECRET_FROM_INDENT_UI INDENT_API_SECRET=MY_CUSTOM_SECRET serverless deploy
```

### Development

The `serverless.yml` comes with the `serverless-offline` plugin to enable local development:

```bash
$ serverless offline

Serverless: Bundling with Webpack...
Time: 5799ms
Built at: 04/16/2020 10:18:41 AM
       Asset      Size  Chunks                   Chunk Names
    index.js  6.02 MiB   index  [emitted]        index
index.js.map  1.13 MiB   index  [emitted] [dev]  index
Entrypoint index = index.js index.js.map
[./index.ts] 2.88 KiB {index} [built]
    + 874 hidden modules
Serverless: Watching for changes...
offline: Starting Offline: dev/us-west-2.
offline: Key with token: d41d8cd98f00b204e9800998ecf8427e
offline: Remember to use x-api-key on the request headers
offline: Offline [http for lambda] listening on http://localhost:3002

   ┌───────────────────────────────────────────────────────────────────────────┐
   │                                                                           │
   │   POST | http://localhost:3000/dev/webhook                                │
   │   POST | http://localhost:3000/2015-03-31/functions/webhook/invocations   │
   │                                                                           │
   └───────────────────────────────────────────────────────────────────────────┘

offline: [HTTP] server ready: http://localhost:3000 🚀
offline:
offline: Enter "rp" to replay the last request
```
