import { Agent, CredentialSession } from '@atproto/api';

export class Bluesky {
  constructor(private username: string, private password: string) {}

  async post(message: string): Promise<boolean> {
    const session = new CredentialSession(new URL('https://bsky.social'))
    await session.login({ identifier: this.username, password: this.password})
    const agent = new Agent(session)
    await agent.post({text: message})
    console.log("Successfully posted message "+message)
    return true
  }
}
