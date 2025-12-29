import { useEffect } from "react";

export type ToastType = {
  type: "info" | "success" | "error";
  message: string;
  onClose: () => void;
};

const Toast = (props: ToastType) => {
  const { type = "info", message } = props;

  useEffect(() => {
    const timer = setTimeout(() => {
      props.onClose();
    }, 5000);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="toast">
      {type === "info" && (
        <div className={"alert alert-info"}>
          <span>{message}</span>
        </div>
      )}
      {type === "success" && (
        <div className={"alert alert-success"}>
          <span>{message}</span>
        </div>
      )}
      {type === "error" && (
        <div className={"alert alert-error"}>
          <span>{message}</span>
        </div>
      )}
    </div>
  );
};

export default Toast;
