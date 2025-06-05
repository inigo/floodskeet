const postMock = jest.fn();
const loginMock = jest.fn();

jest.mock('@atproto/api', () => ({
  Agent: class { post = postMock },
  CredentialSession: class { login = loginMock },
}));

import { Bluesky } from './Bluesky';

describe('Bluesky.post', () => {
  const createBluesky = () => new Bluesky('user', 'pass');

  beforeEach(() => {
    postMock.mockReset();
    loginMock.mockReset();
  });

  it('sends link facet when URL provided and awaits post', async () => {
    let resolvePost: () => void;
    const postPromise = new Promise<void>(res => { resolvePost = res; });
    postMock.mockReturnValue(postPromise);
    loginMock.mockResolvedValue(undefined);

    const bluesky = createBluesky();
    const promise = bluesky.post('hello [world]', 'https://example.com');

    await Promise.resolve();

    expect(postMock).toHaveBeenCalledWith({
      text: 'hello world',
      facets: [
        {
          index: { byteStart: 6, byteEnd: 11 },
          features: [{ $type: 'app.bsky.richtext.facet#link', uri: 'https://example.com' }]
        }
      ]
    });

    let finished = false;
    promise.then(() => { finished = true; });
    await Promise.resolve();
    expect(finished).toBe(false);

    resolvePost!();
    await promise;
    expect(finished).toBe(true);
  });

  it('omits facets when URL missing', async () => {
    postMock.mockResolvedValue(undefined);
    loginMock.mockResolvedValue(undefined);

    const bluesky = createBluesky();
    await bluesky.post('hello [world]');

    expect(postMock).toHaveBeenCalledWith({
      text: 'hello world',
      facets: []
    });
  });
});
