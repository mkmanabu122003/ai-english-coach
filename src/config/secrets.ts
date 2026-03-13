import { SecretManagerServiceClient } from "@google-cloud/secret-manager";

const cache = new Map<string, string>();
let client: SecretManagerServiceClient | null = null;

function getClient(): SecretManagerServiceClient {
  if (!client) {
    client = new SecretManagerServiceClient();
  }
  return client;
}

export async function getSecret(name: string): Promise<string> {
  const cached = cache.get(name);
  if (cached !== undefined) {
    return cached;
  }

  if (process.env.NODE_ENV === "development") {
    const envValue = process.env[name];
    if (envValue) {
      cache.set(name, envValue);
      return envValue;
    }
  }

  const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
  const [version] = await getClient().accessSecretVersion({
    name: `projects/${projectId}/secrets/${name}/versions/latest`,
  });
  const value = version.payload?.data?.toString() ?? "";
  cache.set(name, value);
  return value;
}

export function clearSecretCache(): void {
  cache.clear();
}
