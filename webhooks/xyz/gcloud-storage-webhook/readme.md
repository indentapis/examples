# Google Cloud Storage Webhook

## How To Use

### Requirements

- [gcloud](https://cloud.google.com/sdk/gcloud)

### Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=3 examples-main/webhooks/gcloud-storage-webhook
cd gcloud-storage-webhook
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

Deploy it to the cloud with [Google Cloud Functions](https://cloud.google.com/functions) ([Documentation](https://cloud.google.com/functions/docs)).

## About Example

This is a simple example showing how to use [Google Cloud Functions](https://cloud.google.com/functions) to deploy a function that can add or remove users from Google Cloud Storage buckets programatically.

### Configuration

You will need an _Indent Webhook Secret_ for your app. You can get it from the settings of your app in **Configuration for App**. Then, copy the string labeled **Webhook Secret**. This will allow you to verify request payloads from Indent.

The Indent Webhook Secret should then be set as an environment variable. You can use the `.env.example` file as reference to create `.env.yaml` like this:

```yaml
INDENT_WEBHOOK_SECRET: wks012m1d127f10dj483elkfjw
```

### Development

After setting up environment variables, you can run a development server:

```bash
$ npm run dev
```

```
> @indent/gcloud-storage-webhook@0.0.0 dev /Users/docs/dl/gcloud-storage-webhook
> functions-framework --target=indent-storage-webhook

Serving function...
Function: indent-storage-webhook
URL: http://localhost:8080/
```

### Deployment

To deploy this webhook on Google Cloud Functions, set up the environment variables and choose the project you'd like to deploy then run:

```bash
$ GCP_PROJECT=my-project-123 npm run deploy
```

```
> @indent/gcloud-storage-webhook@0.0.0 deploy /Users/docs/dl/gcloud-storage-webhook
> gcloud functions deploy indent-storage-webhook --env-vars-file .env.yaml --region us-central1 --project=$GCP_PROJECT --runtime=nodejs10 --trigger-http --allow-unauthenticated

Deploying function (may take a while - up to 2 minutes)...done.
availableMemoryMb: 256
entryPoint: indent-storage-webhook
environmentVariables:
  INDENT_WEBHOOK_SECRET: <REDACTED>
httpsTrigger:
  url: https://us-central1-my-project-123.cloudfunctions.net/indent-storage-webhook
ingressSettings: ALLOW_ALL
labels:
  deployment-tool: cli-gcloud
name: projects/my-project-123/locations/us-central1/functions/indent-storage-webhook
runtime: nodejs10
serviceAccountEmail: my-project-123@appspot.gserviceaccount.com
sourceUploadUrl: <REDACTED>
status: ACTIVE
timeout: 60s
updateTime: '2020-06-06T19:51:43.924Z'
versionId: '13'
```

You can use an existing bucket, or create a new one, to grant admin acess to the Cloud Funtion you just created for requesting access:

```bash
$ gsutil iam ch serviceAccount:<serviceAccountEmail>:objectAdmin gs://your-bucket-example
```

### Production

By default, Cloud Functions are deployed with the project default service account but if you're going to use that service account to manage access you likely want to create a dedicated service account and grant specific `objectAdmin` permissions.
