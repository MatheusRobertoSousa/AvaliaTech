type TableSkeletonProps = {
  rows?: number;
  columns?: number;
};

export function MetricSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="metricsGrid">
      {Array.from({ length: count }).map((_, index) => (
        <div className="metricCard skeletonCard" key={index}>
          <span className="skeletonBlock icon" />
          <div>
            <small className="skeletonBlock short" />
            <strong className="skeletonBlock medium" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 5 }: TableSkeletonProps) {
  return (
    <div className="tableScroller">
      <table className="skeletonTable">
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((__, columnIndex) => (
                <td key={columnIndex}>
                  <span className={`skeletonBlock ${columnIndex === 0 ? "long" : "medium"}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PageSkeleton({ columns = 5 }: { columns?: number }) {
  return (
    <section className="page">
      <header className="pageHeader">
        <div>
          <span className="skeletonBlock eyebrowSkeleton" />
          <h1 className="skeletonBlock titleSkeleton" />
          <p className="skeletonBlock subtitleSkeleton" />
        </div>
      </header>
      <MetricSkeleton />
      <article className="panel wide">
        <TableSkeleton rows={6} columns={columns} />
      </article>
    </section>
  );
}
