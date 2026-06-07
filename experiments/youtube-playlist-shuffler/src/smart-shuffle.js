function shuffleCopy(values) {
  const result = [...values];

  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }

  return result;
}

function positionMap(itemIds) {
  return new Map(itemIds.map((itemId, index) => [itemId, index]));
}

function adjacencySet(itemIds) {
  const result = new Set();

  for (let index = 0; index < itemIds.length - 1; index += 1) {
    result.add(`${itemIds[index]}>${itemIds[index + 1]}`);
    result.add(`${itemIds[index + 1]}>${itemIds[index]}`);
  }

  return result;
}

function scoreCandidate(candidate, references) {
  const candidatePositions = positionMap(candidate);
  let score = 0;

  for (const reference of references.orders) {
    const weight = reference.weight;

    for (let index = 0; index < reference.itemIds.length; index += 1) {
      const itemId = reference.itemIds[index];
      const candidateIndex = candidatePositions.get(itemId);

      if (candidateIndex === undefined) {
        continue;
      }

      const distance = Math.abs(candidateIndex - index);
      score += Math.min(distance, 12) * weight;

      if (distance === 0) {
        score -= 80 * weight;
      } else if (distance <= 2) {
        score -= 20 * weight;
      }
    }
  }

  for (let index = 0; index < candidate.length - 1; index += 1) {
    const pair = `${candidate[index]}>${candidate[index + 1]}`;

    for (const adjacent of references.adjacencies) {
      if (adjacent.set.has(pair)) {
        score -= adjacent.weight;
      }
    }
  }

  for (const firstItemId of references.recentFirstItemIds) {
    if (candidate[0] === firstItemId) {
      score -= 500;
    }
  }

  return score;
}

export function createSmartShuffle(currentItemIds, history, candidateCount) {
  const usableHistory = history.shuffles
    .map((shuffle) => shuffle.itemIds)
    .filter((itemIds) => Array.isArray(itemIds) && itemIds.length === currentItemIds.length);
  const baselineItemIds = history.baselineItemIds.length === currentItemIds.length
    ? history.baselineItemIds
    : currentItemIds;

  const references = {
    orders: [
      { itemIds: baselineItemIds, weight: 2.2 },
      { itemIds: currentItemIds, weight: 1.6 },
      ...usableHistory.map((itemIds, index) => ({ itemIds, weight: Math.max(0.6, 1.4 - index * 0.2) }))
    ],
    adjacencies: [
      { set: adjacencySet(baselineItemIds), weight: 45 },
      { set: adjacencySet(currentItemIds), weight: 35 },
      ...usableHistory.map((itemIds) => ({ set: adjacencySet(itemIds), weight: 25 }))
    ],
    recentFirstItemIds: [
      baselineItemIds[0],
      currentItemIds[0],
      ...usableHistory.map((itemIds) => itemIds[0])
    ].filter(Boolean)
  };

  let best = currentItemIds;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (let index = 0; index < candidateCount; index += 1) {
    const candidate = shuffleCopy(currentItemIds);
    const score = scoreCandidate(candidate, references);

    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return {
    itemIds: best,
    score: bestScore
  };
}

export function summarizeShuffle(currentItems, targetItemIds, limit = 15) {
  const currentIndexByItemId = positionMap(currentItems.map((item) => item.playlistItemId));
  const byItemId = new Map(currentItems.map((item) => [item.playlistItemId, item]));

  return targetItemIds.slice(0, limit).map((itemId, index) => {
    const item = byItemId.get(itemId);
    const previousIndex = currentIndexByItemId.get(itemId);
    const movement = previousIndex === undefined ? "new" : `${previousIndex + 1} -> ${index + 1}`;

    return {
      position: index + 1,
      movement,
      title: item?.title ?? itemId
    };
  });
}
