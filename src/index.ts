interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * GreyNoise Community MCP — internet scanner classification (free tier with key)
 *
 * GreyNoise separates "internet background noise" (mass scanners, search
 * engines, benign crawlers) from targeted activity. When triaging an alert,
 * checking the source IP against GreyNoise tells you whether you're seeing
 * targeted intent or one of the billions of daily opportunistic probes.
 *
 * Pairs with: shodan-internetdb (what the IP is running), abuseipdb (community
 * abuse reports), nvd (vulns related to surfaced services).
 *
 * API: https://docs.greynoise.io/reference/community-api
 * Tools:
 * - ip_context: noise/RIOT classification, name, last seen, link
 */


const BASE_URL = 'https://api.greynoise.io/v3/community';

const tools: McpToolExport['tools'] = [
  {
    name: 'ip_context',
    description:
      'Look up an IPv4 against the GreyNoise Community dataset. Returns noise (is the IP scanning the internet?), riot (is it a known good service like Google/Microsoft?), classification (malicious | benign | unknown), name, last-seen date, and a deep link. Useful for noise-suppression in SOC alerts.',
    inputSchema: {
      type: 'object',
      properties: {
        ip: { type: 'string', description: 'IPv4 address' },
      },
      required: ['ip'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  const apiKey = (args._apiKey as string | undefined)?.trim();
  if (!apiKey) {
    throw new Error(
      'GreyNoise requires an API key. Contact the operator about platform credentials, or BYO via ?_apiKey=<key> after registering a free Community account at https://viz.greynoise.io',
    );
  }
  switch (name) {
    case 'ip_context':
      return ipContext(apiKey, String(args.ip).trim());
    default:
      throw new Error(`Unknown tool: ${name}`);
  }
}

interface CommunityResponse {
  ip?: string;
  noise?: boolean;
  riot?: boolean;
  classification?: string;
  name?: string;
  link?: string;
  last_seen?: string;
  message?: string;
}

async function ipContext(apiKey: string, ip: string) {
  if (!ip) throw new Error('ip is required');
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(ip)}`, {
    headers: { key: apiKey, Accept: 'application/json' },
  });
  if (res.status === 401 || res.status === 403) throw new Error('GreyNoise: unauthorized — check the API key');
  if (res.status === 429) throw new Error('GreyNoise: rate-limit hit (HTTP 429)');
  if (res.status === 404) {
    // GreyNoise returns 404 for IPs they have no observation of — surface as a structured result
    return {
      ip,
      observed: false,
      noise: false,
      riot: false,
      classification: 'unknown',
      message: 'IP not observed in GreyNoise (no scanner activity recorded)',
    };
  }
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GreyNoise error: ${res.status} ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as CommunityResponse;
  return {
    ip: data.ip ?? ip,
    observed: true,
    noise: data.noise ?? false,
    riot: data.riot ?? false,
    classification: data.classification ?? 'unknown',
    name: data.name ?? null,
    last_seen: data.last_seen ?? null,
    link: data.link ?? `https://viz.greynoise.io/ip/${ip}`,
    message: data.message ?? null,
  };
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
