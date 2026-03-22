import "./lando-text.css";

const LandoText = ({ children, className }: { children: string, className: string }) => {
  const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" });
  const segments = [...segmenter.segment(children)];
  const chars = segments.map(s => s.segment);

  return (
    <div className="lando-container">
      {chars.map((ch, idx) => {
        return (
          <span
            key={idx}
            className={`${className} lando-styles`}
            style={{ transitionDelay: `${idx * 0.05}s` }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
}

export default LandoText;
