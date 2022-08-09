## Download

Download the example:

```bash
curl https://codeload.github.com/indentapis/examples/tar.gz/main | tar -xz --strip=2 examples-main/serverless/aws-tailscale
cd aws-tailscale
```

## Usage

### Configuration

Edit the environment variables in `serverless.yml` to match your configuration:

```yaml
environment:
  INDENT_WEBHOOK_SECRET: "<redacted>" # https://indent.com/catalog/tailscale
  TAILSCALE_API_KEY: "<redacted>" # https://indent.com/docs/integrations/tailscale#4-connecting-to-tailscale
  TAILSCALE_TAILNET: "example.com"
```

### Deployment

In order to deploy this example, you need to run the following command:

```
$ serverless deploy
```
