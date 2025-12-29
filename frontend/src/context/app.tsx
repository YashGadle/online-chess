import { createContext, useContext, useState } from "react";

import Toast from "../components/toast";

type ToastMessageType = {
  type: "info" | "success" | "error";
  message: string;
};

type AppContext = {
  showToast: (args: ToastMessageType) => void;
};

const AppContext = createContext<AppContext | undefined>(undefined);

const AppContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [toast, setToast] = useState<ToastMessageType>();
  const showToast = (toast: ToastMessageType) => {
    setToast(toast);
  };

  return (
    <AppContext.Provider
      value={{
        showToast,
      }}
    >
      {toast && <Toast {...toast} onClose={() => setToast(undefined)} />}
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  return context as AppContext;
};

export default AppContextProvider;
