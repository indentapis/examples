# Vercel Webhook

## How To Use

### Requirements

- [Vercel](https://vercel.com)

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/vercel-webhook
cd vercel-webhook
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

Deploy it to the cloud with [Vercel](https://vercel.com/).

## About Example

This is a simple example showing how to use [Vercel](https://vercel.com) to deploy a function that can handle access requests programatically.

### Configuration

You will need an _Indent Webhook Secret_ for your app. You can get it from the settings of your app in **Configuration for App**. Then, copy the string labeled **Webhook Secret**. This will allow you to verify request payloads from Indent.

The Indent Webhook Secret should then be set as an environment variable:

```bash
INDENT_WEBHOOK_SECRET=SUPER_SECRET_FROM_INDENT_UI vercel
```

### Development

You can run the server locally:

```bash
$ npm run start
```

### Deployment

When you're ready to deploy, you can run either connect a git repository to Vercel or run the command:

```bash
$ vercel deploy
```
