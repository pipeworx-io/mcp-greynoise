# @pipeworx/greynoise

GreyNoise Community MCP — IP scanner classification.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1394+ live data sources.

## Tools

- `ip_context(ip)` — noise / RIOT classification, name, last seen.

## Auth

- **Platform key:** gateway env `PLATFORM_GREYNOISE_KEY`.
- **BYO:** `?_apiKey=<key>` after registering at https://viz.greynoise.io.

## Data source

`https://api.greynoise.io/v3/community/{ip}` — header `key`.

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "greynoise": {
      "url": "https://gateway.pipeworx.io/greynoise/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1394+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Greynoise data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [Docs and guides](https://pipeworx.io/docs)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
