# n8n-nodes-kreatoai

This is an n8n community node for [Kreatoai](https://kreatoai.com). It lets you publish and schedule posts on Facebook, Instagram, TikTok, LinkedIn, YouTube, Bluesky, Google Business and Pinterest from your n8n workflows.

[Installation](#installation) · [Credentials](#credentials) · [Operations](#operations) · [Usage](#usage) · [Resources](#resources)

## Installation

Follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation, and install the package `n8n-nodes-kreatoai`.

## Credentials

You need a Kreatoai account and an API key.

1. Sign up at [kreatoai.com](https://kreatoai.com) and connect your social accounts.
2. In the dashboard, open **ChatGPT, Claude and API**, then **API keys**, and create a key. Copy it: the full key is shown only once.
3. In n8n, create a **Kreatoai API** credential and paste the key (it starts with `sk-kre-v1-`).

n8n checks the key when you save the credential.

## Operations

| Resource | Operations |
|---|---|
| Post | Create, Get, Get Many, Update, Cancel |
| Account | Get Many |
| Media | Upload (from a URL or a binary file) |
| Workspace | Get |

**Post > Create** publishes right away, or at the time set in **Schedule Time**. Pick one or more connected accounts in **Accounts**. Optional fields: media URLs (up to 10), story format, a first comment on Facebook and Instagram, an idempotency key, and advanced settings per network in **Network Options**.

**Post > Get** returns the status of the post on each network, with the link to the published post.

The node can also be used as a tool by an n8n AI agent.

## Usage

A typical workflow:

1. **Media > Upload** with the link of your video or image (or a binary file from a previous node).
2. **Post > Create** with the accounts, the text and the `url` returned by the upload in **Media URLs**.
3. **Post > Get** later to check that each network published it.

Each network has its own rules (text length, image or video required). When a post doesn't fit a network, the node returns the reason from the API, for example `video_required_for_target` for YouTube.

On the free plan, you can create 10 posts per month.

## Compatibility

Tested with n8n 2.46.

## Resources

- [Kreatoai API documentation](https://kreatoai.com/developers)
- [Using Kreatoai with n8n](https://kreatoai.com/developers/n8n)
- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)

## License

[MIT](LICENSE.md)
