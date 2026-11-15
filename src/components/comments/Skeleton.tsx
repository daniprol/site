/**
 * What the comments look like before they load: two grey comment boxes in the same layout. Rendered into the
 * static HTML too, so the section never pops in from nothing.
 */
export function Skeleton({ label }: { label: string }) {
  return (
    <div className="cx-skeleton" aria-busy="true">
      <span className="sr-only" role="status">
        {label}
      </span>
      {[3, 2].map((lines) => (
        <div key={lines} className="cx-item" aria-hidden="true">
          <span className="cx-avatar cx-shimmer" />
          <div className="cx-box">
            <div className="cx-head cx-head-box">
              <span className="cx-shimmer cx-bone" style={{ width: "11rem" }} />
            </div>
            <div className="cx-body">
              {Array.from({ length: lines }, (_, index) => (
                <span
                  key={index}
                  className="cx-shimmer cx-bone"
                  style={{ width: index === lines - 1 ? "55%" : "100%" }}
                />
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
