export const extractGameIdFromUrl = (url: string) => {
  const arr = url.split("/");
  return arr[arr.length - 1];
};
