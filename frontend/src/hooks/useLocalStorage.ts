const useLocalStorage = () => {
  //TODO: fix this implementation to be type safe.
  // TODO: handle game fen updates inside it so that component don't have to.
  const set = (key: string, value: unknown) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("localStorage set failed", e);
    }
  };

  const get = <T>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : null;
    } catch {
      return null;
    }
  };

  const remove = (key: string) => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error("localStorage remove failed", e);
    }
  };

  return { set, get, remove };
};

export default useLocalStorage;
