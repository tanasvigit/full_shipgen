import { formatDistanceToNow } from "date-fns";

function ts(value) {
  const d = value ? new Date(value) : null;
  return d && !Number.isNaN(d.getTime()) ? d.getTime() : 0;
}

function mapCommentToFeedItem(comment) {
  const id = comment?.uuid || comment?.id || comment?.public_id;
  const created = comment?.created_at || comment?.updated_at;
  return {
    id: `comment-${id}`,
    kind: "comment",
    icon: "edit",
    title: "Comment",
    detail: comment?.body || comment?.content || comment?.message || "",
    status: null,
    actor: comment?.author?.name || comment?.user?.name || "Dispatcher",
    at: created,
    relative: created ? formatDistanceToNow(new Date(created), { addSuffix: true }) : "",
    optimistic: Boolean(comment?._optimistic),
  };
}

/** Merge activity timeline events and order comments into one operational feed. */
export function mergeOperationalFeed(activityEvents = [], comments = []) {
  const activityItems = (activityEvents || []).map((e) => ({
    ...e,
    kind: e.kind || "activity",
    at: e.at || e.created_at || e.timestamp,
  }));

  const commentItems = (comments || []).map(mapCommentToFeedItem);

  return [...activityItems, ...commentItems]
    .sort((a, b) => ts(b.at) - ts(a.at))
    .map((item, index) => ({
      ...item,
      id: item.id || `feed-${index}`,
    }));
}
