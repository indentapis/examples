# Google Cloud Google Group Webhook

## How To Use

### Requirements

- [gcloud CLI](https://cloud.google.com/sdk/gcloud)
- [Google Cloud Project](https://cloud.google.com/resource-manager/docs/creating-managing-projects)
  - [Enable Functions](https://console.cloud.google.com/apis/api/cloudfunctions.googleapis.com)
  - [Enable Cloud Build](https://console.cloud.google.com/marketplace/product/google/cloudbuild.googleapis.com)
  - [Enable Cloud Identity](https://console.cloud.google.com/marketplace/product/google/cloudidentity.googleapis.com)

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=2 examples-main/webhooks/gcloud-google-groups-webhook
cd gcloud-google-groups-webhook
```

Install it and build:

**NPM**

```bash
npm install
npm run build
```

**Yarn**

```bash
yarn
yarn build
```

Deploy it to the cloud with [Google Cloud Functions](https://cloud.google.com/functions) ([Documentation](https://cloud.google.com/functions/docs)).

## About Example

This is a simple example showing how to use [Google Cloud Functions](https://cloud.google.com/functions) to deploy a function that can add or remove users from Google Groups programatically.

### Configuration

You will need an _Indent Webhook Secret_ for your app. You can get it from the settings of your app in **Configuration for App**. Then, copy the string labeled **Webhook Secret**. This will allow you to verify request payloads from Indent.

The Indent Webhook Secret should then be set as an environment variable. You can use the `.env.example` file as reference to create `.env.yaml` like this:

```yaml
INDENT_WEBHOOK_SECRET: wks012m1d127f10dj483elkfjw
```

### Service Account-based Authentication

You can create a Google Group or view an existing one in [Google Admin Groups](https://admin.google.com/ac/groups) and add the `serviceAccountEmail` used by your deployed function as a Manager to the group. Connect the group as a resource in the Indent dashboard and now your users can easily request access to the group.

### Credential-based Authentication

For Google Authentication, you will need `credentials.json` (represents your App) and `token.json` (represents an authorized user, like you or a service account) to set up this webhook.

1. To create `credentials.json` go to your [Google Cloud Console OAuth consent screen](https://console.cloud.google.com/apis/credentials/consent) and select "Internal" if you're only planning to use this for your own organization (recommended) or "External". Fill out the required fields, click "Save and Continue" on the next page and then click "Credentials" in the sidebar.

2. Create a new "OAuth client ID" credential, select "Desktop App" and download the JSON (by clicking the download icon in the row) to this folder as `credentials.json` to finish.

3. In development, when you run the `dev` script in your `package.json` and then run the `test` script after updating `test/config.json` to be accurate, the server will prompt you to authenticate in your browser. After you do this once, there will be a `token.json` in this directory. For production, load `credential.json` and `token.json` as secrets/environment variables in your CI process .

If you're looking for more information, check out: [Setting up OAuth 2.0 on Google Cloud Platform Console Help](https://support.google.com/cloud/answer/6158849)

### Development

After setting up environment variables, you can run a development server:

```bash
$ npm run dev
```

```
> @indent/gcloud-google-groups-webhook@0.0.0 dev /Users/docs/dl/gcloud-google-groups-webhook
> functions-framework --target=webhook

Serving function...
Function: webhook
URL: http://localhost:8080/
```

### Deployment

Build the latest from source:

```bash
$ npm run build
```

To deploy this webhook on Google Cloud Functions, set up the environment variables and choose the project you'd like to deploy then run:

```bash
$ GCP_PROJECT=my-project-123 npm run deploy
```

```
> @indent/gcloud-google-groups-webhook@0.0.0 deploy /Users/docs/dl/gcloud-google-groups-webhook
> gcloud functions deploy indent-google-groups-webhook --env-vars-file .env.yaml --region us-central1 --project=$GCP_PROJECT --runtime=nodejs10 --trigger-http --allow-unauthenticated

Deploying function (may take a while - up to 2 minutes)...done.
availableMemoryMb: 256
entryPoint: indent-google-groups-webhook
environmentVariables:
  INDENT_WEBHOOK_SECRET: <REDACTED>
httpsTrigger:
  url: https://us-central1-my-project-123.cloudfunctions.net/indent-google-groups-webhook
ingressSettings: ALLOW_ALL
labels:
  deployment-tool: cli-gcloud
name: projects/my-project-123/locations/us-central1/functions/indent-google-groups-webhook
runtime: nodejs10
serviceAccountEmail: my-project-123@appspot.gserviceaccount.com
sourceUploadUrl: <REDACTED>
status: ACTIVE
timeout: 60s
updateTime: '2020-06-06T19:51:43.924Z'
versionId: '13'
```
