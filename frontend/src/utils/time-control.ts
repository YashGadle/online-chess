export type TimeControlSelectT = {
  title: string;
  description: string;
  value: string;
};

export const timeControlOptions: Array<TimeControlSelectT> = [
  {
    title: "1 + 0",
    description: "Bullet",
    value: "1|0",
  },
  {
    title: "3 + 1",
    description: "Blitz",
    value: "3|1",
  },

  {
    title: "5 + 2",
    description: "Blitz",
    value: "5|2",
  },
  {
    title: "10 + 5",
    description: "Rapid",
    value: "10|5",
  },

];

