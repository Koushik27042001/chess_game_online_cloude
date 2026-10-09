export default function MoveHistory({ moves = [] }) {
  const rows = [];
  for (let i = 0; i < moves.length; i += 2) {
    rows.push({
      n: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || "",
    });
  }

  return (
    <div className="panel flex max-h-64 flex-col overflow-hidden sm:max-h-80">
      <div className="border-b border-white/10 px-3 py-2 text-sm font-medium">Move history</div>
      <div className="flex-1 overflow-y-auto p-2 text-sm">
        {rows.length === 0 && <p className="px-1 py-2 text-white/40">No moves yet</p>}
        <ol className="space-y-1">
          {rows.map((row) => (
            <li key={row.n} className="grid grid-cols-[2rem_1fr_1fr] gap-2 rounded px-1 py-0.5 hover:bg-white/5">
              <span className="text-white/40">{row.n}.</span>
              <span>{row.white}</span>
              <span>{row.black}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
