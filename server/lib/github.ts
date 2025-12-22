// GitHub Integration - Uses Personal Access Token or Replit Connector
import { Octokit } from '@octokit/rest'

let connectionSettings: any;

async function getAccessToken(): Promise<string> {
  // First, check for personal access token in environment
  if (process.env.GITHUB_TOKEN) {
    return process.env.GITHUB_TOKEN;
  }

  // Fallback to Replit connector
  if (connectionSettings && connectionSettings.settings?.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
    return connectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('GITHUB_TOKEN not set and Replit connector not available');
  }

  try {
    connectionSettings = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    ).then(res => res.json()).then(data => data.items?.[0]);

    const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

    if (!connectionSettings || !accessToken) {
      throw new Error('GitHub not connected');
    }
    return accessToken;
  } catch (error) {
    throw new Error('GitHub not connected. Please set GITHUB_TOKEN environment variable.');
  }
}

// WARNING: Never cache this client when using Replit connector.
// For personal access tokens, the client can be reused.
export async function getUncachableGitHubClient() {
  const accessToken = await getAccessToken();
  return new Octokit({ auth: accessToken });
}
