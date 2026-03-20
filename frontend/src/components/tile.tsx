type PropsT = {
  active?: boolean;
  title: string;
  subtitle: string;
};

const Tile = (props: PropsT) => {
  const { title, subtitle, active } = props;
  return (
    <div className="flex flex-col gap-4 items-center justify-center w-55 h-37.5 bg-gray-700 rounded-sm cursor-pointer">
      <div className="text-[2rem] font-bold">{title}</div>
      <div className="text-[0.8rem] font-light uppercase tracking-widest">{subtitle}</div>
    </div>
  );
}

export { Tile };
