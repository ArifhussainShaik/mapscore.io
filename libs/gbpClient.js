/**
 * Publish a post to a managed location's GBP via the Business Profile API.
 * If the location is not OAuth-connected, returns draftOnly (interim mode).
 */
export async function publishPost(location, post) {
  if (!location.managed || !location.gbpOAuth?.accessToken) {
    return { published: false, draftOnly: true };
  }

  // localPosts.create on the Business Profile API.
  // Endpoint shape (verify against current API version at build):
  //   POST https://mybusiness.googleapis.com/v4/{locationResourceName}/localPosts
  try {
    const res = await fetch(
      `https://mybusiness.googleapis.com/v4/${location.gbpOAuth.locationResourceName}/localPosts`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${location.gbpOAuth.accessToken}`,
          "content-type": "application/json",
        },
        body: JSON.stringify({
          languageCode: "en",
          summary: post.content,
          topicType: "STANDARD",
          ...(post.ctaUrl ? { callToAction: { actionType: post.ctaType || "LEARN_MORE", url: post.ctaUrl } } : {}),
        }),
      }
    );

    if (!res.ok) {
      return { published: false, draftOnly: false, error: await res.text() };
    }
    return { published: true, draftOnly: false, result: await res.json() };
  } catch (err) {
    return { published: false, draftOnly: false, error: err?.message || String(err) };
  }
}
