# Azure Okta Webhook

## How To Use

### Requirements

- [Azure Function VS Code](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-function-vs-code?pivots=programming-language-javascript)
- [Azure Function CLI](https://docs.microsoft.com/en-us/azure/azure-functions/functions-create-first-azure-function-azure-cli?tabs=bash%2Cbrowser&pivots=programming-language-javascript)
- [Azure Function Environment Variables](https://docs.microsoft.com/en-us/azure/azure-functions/functions-reference-node#environment-variables)

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/azure-okta-webhook
cd azure-okta-webhook
```

Install it and run:

**NPM**

```bash
npm install
npm run start
```

**Yarn**

```bash
yarn
yarn start
```

## About Example

This is a simple example showing how to use [Azure Functions](https://azure.com/functions) to deploy a function that can add or remove users from Okta Groups programatically.

### Configuration

You will need an _Indent Webhook Secret_ for your app. You can get it from the settings of your app in **Configuration for App**. Then, copy the string labeled **Webhook Secret**. This will allow you to verify request payloads from Indent.

The Indent Webhook Secret should then be set as an environment variable along with your Okta tenant and token. You can use the `.env.example` file as reference to create `.env.yaml` like this:

```yaml
INDENT_WEBHOOK_SECRET: wks012m1d127f10dj483elkfjw
OKTA_DOMAIN: example.okta.com
OKTA_TOKEN: 00QQ9jmcw101dlf07_emXMA12QrFHt
```
