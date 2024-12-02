import { Agent, CredentialSession } from '@atproto/api';

export class Bluesky {
  constructor(private username: string, private password: string) {}

  async post(message: string, url?: string): Promise<boolean> {
    const session = new CredentialSession(new URL('https://bsky.social'))
    await session.login({ identifier: this.username, password: this.password})
    const agent = new Agent(session)

    const bracketIndices = this.findBracketIndices(message)
    const hasLink = url && bracketIndices && bracketIndices.openIndex < bracketIndices.closeIndex;
    const messageWithoutBraces = message.replace(/[\[\]]/g, '')
    const facets = hasLink ? [
      {
        "index": {
          "byteStart": bracketIndices.openIndex,
          "byteEnd": bracketIndices.closeIndex - 1 // removing the braces adjusts the position
        },
        "features": [
          {
            "$type": "app.bsky.richtext.facet#link",
            "uri": url
          }
        ]
      }
    ] : [];

    agent.post(
      {
        text: messageWithoutBraces,
        facets: facets
      }
    )
    console.log("Successfully posted message "+messageWithoutBraces+" with facets "+facets)
    return true
  }

  findBracketIndices(str: string): { openIndex: number, closeIndex: number } | null {
    const openIndex = str.indexOf('[');
    const closeIndex = str.indexOf(']');

    if (openIndex === -1 || closeIndex === -1) {
      return null;
    }

    return { openIndex, closeIndex };
  }
}
