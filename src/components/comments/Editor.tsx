/**
 * GitHub's comment editor: Write and Preview tabs over a textarea, with the Markdown rendered by GitHub
 * itself for the preview. Ctrl/⌘ + Enter posts.
 */
import { useId, useState, type KeyboardEvent, type SubmitEvent } from "react";

import { previewMarkdown } from "./api";
import { useComments } from "./context";

interface Props {
  placeholder: string;
  submitLabel: string;
  /** Posts the text; a thrown error's message is shown under the box. */
  onSubmit: (body: string) => Promise<void>;
  /** Shows a Cancel button (reply boxes). */
  onCancel?: () => void;
  /** Take focus on mount (reply boxes, which open because the reader asked for one). */
  focusOnOpen?: boolean;
}

/** GitHub's own limit on a comment's length (the Worker checks it too). */
const MAX_COMMENT_LENGTH = 65_536;

/** The Preview tab: nothing yet, waiting for GitHub, or the rendered HTML of `text`. */
type Preview = { status: "idle" } | { status: "loading" } | { status: "ready"; text: string; html: string };

export function Editor({ placeholder, submitLabel, onSubmit, onCancel, focusOnOpen = false }: Props) {
  const { labels } = useComments();
  const [body, setBody] = useState("");
  const [tab, setTab] = useState<"write" | "preview">("write");
  const [preview, setPreview] = useState<Preview>({ status: "idle" });
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fieldId = useId();

  const showPreview = async () => {
    setTab("preview");
    // Nothing to render, or the preview already shows this exact text.
    if (!body.trim() || (preview.status === "ready" && preview.text === body)) return;
    setPreview({ status: "loading" });
    try {
      setPreview({ status: "ready", text: body, html: await previewMarkdown(body) });
    } catch (caught) {
      setPreview({ status: "idle" });
      setError(caught instanceof Error ? caught.message : String(caught));
    }
  };

  const send = async () => {
    if (!body.trim() || posting) return;
    setPosting(true);
    setError(null);
    try {
      await onSubmit(body);
      setBody("");
      setTab("write");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setPosting(false);
    }
  };

  const onFormSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    void send();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) void send();
  };

  return (
    <form className="cx-editor" onSubmit={onFormSubmit}>
      <div className="cx-tabs" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "write"} onClick={() => setTab("write")}>
          {labels.write}
        </button>
        <button type="button" role="tab" aria-selected={tab === "preview"} onClick={() => void showPreview()}>
          {labels.preview}
        </button>
      </div>

      <div className="cx-editor-field">
        {tab === "write" ? (
          <>
            <label htmlFor={fieldId} className="sr-only">
              {placeholder}
            </label>
            <textarea
              id={fieldId}
              value={body}
              placeholder={placeholder}
              maxLength={MAX_COMMENT_LENGTH}
              disabled={posting}
              // eslint-disable-next-line jsx-a11y/no-autofocus -- see focusOnOpen
              autoFocus={focusOnOpen}
              onChange={(event) => setBody(event.target.value)}
              onKeyDown={onKeyDown}
            />
          </>
        ) : preview.status === "ready" && preview.text === body ? (
          // Rendered and sanitised by GitHub, like posted comments.
          <div className="cx-body cx-preview" dangerouslySetInnerHTML={{ __html: preview.html }} />
        ) : (
          <p className="cx-preview cx-muted">
            {preview.status === "loading" ? labels.loading : labels.nothingToPreview}
          </p>
        )}
      </div>

      <div className="cx-editor-foot">
        <span className="cx-hint">{labels.markdown}</span>
        {error && (
          <span className="cx-error" role="alert">
            {error}
          </span>
        )}
        {onCancel && (
          <button type="button" className="cx-button" onClick={onCancel}>
            {labels.cancel}
          </button>
        )}
        <button type="submit" className="cx-button cx-button-primary" disabled={posting || !body.trim()}>
          {posting ? labels.submitting : submitLabel}
        </button>
      </div>
    </form>
  );
}
