/**
 * Comments as GitHub Discussions: one discussion per page, in one category, titled with the page's term.
 * Signed-out reads and creating discussions run as the app; signed-in reads, comments and reactions run as the
 * visitor, so GitHub records them as theirs and reports which reactions are theirs.
 *
 * All calls use GitHub's GraphQL API. The queries are plain strings; a `fragment` is a reusable list of
 * fields that queries pull in with `...FragmentName`. The `*Node` interfaces below describe what GitHub
 * returns, and the `to*` functions at the bottom turn that into the shapes in contract.ts.
 */
import type { Comment, Reaction, ReactionContent, Reply, Thread } from "../contract";
import { utf8 } from "../encoding";
import type { Env } from "../env";
import { graphql } from "./client";

/** GitHub's cap per page of a connection. Threads longer than this link to GitHub for the rest. */
const PAGE_SIZE = 100;

/** The fields read for each reaction on a comment. */
const REACTION_FIELDS = /* GraphQL */ `
  fragment ReactionFields on ReactionGroup {
    content
    viewerHasReacted
    reactors {
      totalCount
    }
  }
`;

/** The fields read for each comment or reply. */
const COMMENT_FIELDS = /* GraphQL */ `
  fragment CommentFields on DiscussionComment {
    id
    url
    bodyHTML
    createdAt
    lastEditedAt
    deletedAt
    isMinimized
    minimizedReason
    authorAssociation
    author {
      login
      avatarUrl
      url
    }
    reactionGroups {
      ...ReactionFields
    }
  }
  ${REACTION_FIELDS}
`;

/** A comment or reply as GitHub returns it (see COMMENT_FIELDS). */
interface CommentNode {
  id: string;
  url: string;
  bodyHTML: string;
  createdAt: string;
  lastEditedAt: string | null;
  deletedAt: string | null;
  isMinimized: boolean;
  minimizedReason: string | null;
  authorAssociation: string;
  author: { login: string; avatarUrl: string; url: string } | null;
  reactionGroups: ReactionGroup[];
}

/** One reaction and how many people gave it, as GitHub returns it. */
interface ReactionGroup {
  content: ReactionContent;
  viewerHasReacted: boolean;
  reactors: { totalCount: number };
}

interface CommentWithReplies extends CommentNode {
  replies: { totalCount: number; nodes: CommentNode[] };
}

/** The node ID and number of a discussion, enough to read it or comment on it. */
export interface DiscussionRef {
  id: string;
  number: number;
}

/** The `owner` and `name` variables most queries need, from GITHUB_REPOSITORY ("owner/name"). */
const repositoryVariables = (env: Env) => {
  const [owner, name] = env.GITHUB_REPOSITORY.split("/");
  return { owner, name };
};

/**
 * Finds the page's discussion by exact title. Lists the category instead of using search, which matches
 * loosely and lags behind new discussions by up to a minute. If two discussions share a title, the oldest wins.
 */
export async function findDiscussion(env: Env, token: string, term: string): Promise<DiscussionRef | null> {
  let after: string | null = null;
  do {
    const data: DiscussionPage = await graphql<DiscussionPage>(token, LIST_DISCUSSIONS, {
      ...repositoryVariables(env),
      categoryId: env.GITHUB_DISCUSSION_CATEGORY_ID,
      after,
    });
    const { nodes, pageInfo } = data.repository.discussions;
    const match = nodes.find((discussion) => discussion.title === term);
    if (match) return { id: match.id, number: match.number };
    after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
  } while (after);
  return null;
}

/** One page of the category's discussions, as LIST_DISCUSSIONS returns it. */
interface DiscussionPage {
  repository: {
    discussions: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      nodes: { id: string; number: number; title: string }[];
    };
  };
}

const LIST_DISCUSSIONS = /* GraphQL */ `
  query ($owner: String!, $name: String!, $categoryId: ID!, $after: String) {
    repository(owner: $owner, name: $name) {
      discussions(categoryId: $categoryId, first: ${PAGE_SIZE}, after: $after, orderBy: { field: CREATED_AT, direction: ASC }) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          id
          number
          title
        }
      }
    }
  }
`;

/** The page's comments with their replies, oldest first. */
export async function readThread(env: Env, token: string, discussion: DiscussionRef): Promise<Thread> {
  const data = await graphql<{
    repository: { discussion: { url: string; comments: { totalCount: number; nodes: CommentWithReplies[] } } };
  }>(token, READ_THREAD, { ...repositoryVariables(env), number: discussion.number });
  const { url, comments } = data.repository.discussion;
  return { url, commentCount: comments.totalCount, comments: comments.nodes.map(toComment) };
}

const READ_THREAD = /* GraphQL */ `
  ${COMMENT_FIELDS}
  query ($owner: String!, $name: String!, $number: Int!) {
    repository(owner: $owner, name: $name) {
      discussion(number: $number) {
        url
        comments(first: ${PAGE_SIZE}) {
          totalCount
          nodes {
            ...CommentFields
            replies(first: ${PAGE_SIZE}) {
              totalCount
              nodes {
                ...CommentFields
              }
            }
          }
        }
      }
    }
  }
`;

/**
 * Starts the page's discussion, in the same shape giscus uses: the term as title, a link to the page, and
 * the term's SHA-1 in a comment so giscus could find it again in strict mode.
 */
export async function createDiscussion(env: Env, token: string, term: string, pageUrl: string): Promise<DiscussionRef> {
  const sha1 = await sha1Hex(term);
  const data = await graphql<{ createDiscussion: { discussion: DiscussionRef } }>(token, CREATE_DISCUSSION, {
    repositoryId: env.GITHUB_REPOSITORY_ID,
    categoryId: env.GITHUB_DISCUSSION_CATEGORY_ID,
    title: term,
    body: `# ${term}\n\nComments on ${pageUrl}\n\n<!-- sha1: ${sha1} -->`,
  });
  return data.createDiscussion.discussion;
}

const CREATE_DISCUSSION = /* GraphQL */ `
  mutation ($repositoryId: ID!, $categoryId: ID!, $title: String!, $body: String!) {
    createDiscussion(input: { repositoryId: $repositoryId, categoryId: $categoryId, title: $title, body: $body }) {
      discussion {
        id
        number
      }
    }
  }
`;

/** Posts a comment, or a reply when `replyTo` is set. Run with the visitor's token, so it is theirs. */
export async function addComment(
  userToken: string,
  discussion: DiscussionRef,
  body: string,
  replyTo?: string,
): Promise<Comment> {
  const data = await graphql<{ addDiscussionComment: { comment: CommentNode } }>(userToken, ADD_COMMENT, {
    discussionId: discussion.id,
    body,
    replyToId: replyTo ?? null,
  });
  return toComment({ ...data.addDiscussionComment.comment, replies: { totalCount: 0, nodes: [] } });
}

const ADD_COMMENT = /* GraphQL */ `
  ${COMMENT_FIELDS}
  mutation ($discussionId: ID!, $body: String!, $replyToId: ID) {
    addDiscussionComment(input: { discussionId: $discussionId, body: $body, replyToId: $replyToId }) {
      comment {
        ...CommentFields
      }
    }
  }
`;

/** Adds or removes the visitor's reaction on a comment or reply, and returns the subject's reactions after it. */
export async function setReaction(
  userToken: string,
  subjectId: string,
  content: ReactionContent,
  remove: boolean,
): Promise<Reaction[]> {
  // GitHub has one mutation to add and another to remove; both answer with the same shape.
  const mutation = remove ? "removeReaction" : "addReaction";
  const data = await graphql<Record<string, { subject: { reactionGroups: ReactionGroup[] } }>>(
    userToken,
    /* GraphQL */ `
      ${REACTION_FIELDS}
      mutation ($subjectId: ID!, $content: ReactionContent!) {
        ${mutation}(input: { subjectId: $subjectId, content: $content }) {
          subject {
            reactionGroups {
              ...ReactionFields
            }
          }
        }
      }
    `,
    { subjectId, content },
  );
  return toReactions(data[mutation]?.subject.reactionGroups ?? []);
}

/** The SHA-1 of `text` as 40 hex digits. */
async function sha1Hex(text: string): Promise<string> {
  const hash = await crypto.subtle.digest("SHA-1", utf8(text));
  return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

/** A GitHub comment node in the API's shape. Deleted comments keep their place but lose their text. */
function toReply(node: CommentNode): Reply {
  return {
    id: node.id,
    url: node.url,
    author: node.author,
    byOwner: node.authorAssociation === "OWNER",
    bodyHTML: node.deletedAt ? "" : node.bodyHTML,
    createdAt: node.createdAt,
    edited: node.lastEditedAt !== null,
    deleted: node.deletedAt !== null,
    minimized: node.isMinimized
      ? { reason: (node.minimizedReason ?? "hidden").toLowerCase().replace(/_/g, "-") }
      : null,
    reactions: toReactions(node.reactionGroups),
  };
}

/** Only the reactions someone actually gave; GitHub also lists the unused ones with a count of zero. */
function toReactions(groups: ReactionGroup[]): Reaction[] {
  return groups
    .filter((group) => group.reactors.totalCount > 0)
    .map((group) => ({
      content: group.content,
      count: group.reactors.totalCount,
      viewerHasReacted: group.viewerHasReacted,
    }));
}

/** A top-level comment with its replies, in the API's shape. */
function toComment(node: CommentWithReplies): Comment {
  return { ...toReply(node), replies: node.replies.nodes.map(toReply), replyCount: node.replies.totalCount };
}
