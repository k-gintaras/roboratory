export async function fetchPlaylistItems(youtube, playlistId) {
  const items = [];
  let pageToken;

  do {
    const response = await youtube.playlistItems.list({
      part: ["id", "snippet", "contentDetails"],
      playlistId,
      maxResults: 50,
      pageToken
    });

    items.push(...(response.data.items ?? []));
    pageToken = response.data.nextPageToken;
  } while (pageToken);

  return items
    .filter((item) => item.id && item.snippet?.resourceId?.videoId)
    .sort((a, b) => (a.snippet.position ?? 0) - (b.snippet.position ?? 0))
    .map((item) => ({
      playlistItemId: item.id,
      videoId: item.snippet.resourceId.videoId,
      title: item.snippet.title ?? "(untitled)",
      position: item.snippet.position ?? 0,
      playlistId: item.snippet.playlistId,
      resourceId: item.snippet.resourceId
    }));
}

export async function movePlaylistItem(youtube, item, position) {
  await youtube.playlistItems.update({
    part: ["snippet"],
    requestBody: {
      id: item.playlistItemId,
      snippet: {
        playlistId: item.playlistId,
        resourceId: item.resourceId,
        position
      }
    }
  });
}

export async function applyTargetOrder(youtube, currentItems, targetItemIds) {
  const byPlaylistItemId = new Map(currentItems.map((item) => [item.playlistItemId, item]));
  const current = [...currentItems];
  const updates = [];

  for (let targetIndex = 0; targetIndex < targetItemIds.length; targetIndex += 1) {
    const wantedItemId = targetItemIds[targetIndex];
    const currentIndex = current.findIndex((item) => item.playlistItemId === wantedItemId);

    if (currentIndex === -1) {
      throw new Error(`Target playlist item is missing from current playlist: ${wantedItemId}`);
    }

    if (currentIndex === targetIndex) {
      continue;
    }

    const [item] = current.splice(currentIndex, 1);
    current.splice(targetIndex, 0, item);
    updates.push({ item: byPlaylistItemId.get(wantedItemId), position: targetIndex });
    await movePlaylistItem(youtube, item, targetIndex);
  }

  return updates;
}
