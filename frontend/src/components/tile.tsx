type PropsT = {
  active?: boolean;
  title: string;
  subtitle: string;
  value: string;
  onClick: (val: string) => void;
};

const Tile = (props: PropsT) => {
  const { title, subtitle, value, active, onClick } = props;
  return (
    <button
      onClick={() => onClick(value)}
      className={`relative flex flex-col gap-4 items-center justify-center lg:w-55 h-37.5 bg-tertiary-100 rounded-sm cursor-pointer ${active && "active-border"}`}>
      <div className="text-[2rem] font-medium">{title}</div>
      <div className="text-[0.8rem] font-light uppercase tracking-widest">{subtitle}</div>
      {active && <div className="absolute top-2 right-2 bg-amber-300 w-[6px] h-[6px] rounded-full [box-shadow:0_0_5px_2px_rgba(234,179,8,0.6)]" />}
    </button>
  );
}

export { Tile };
