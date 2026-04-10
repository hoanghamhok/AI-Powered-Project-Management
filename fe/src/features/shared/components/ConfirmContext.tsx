import { createContext, useContext, useState, } from "react";
import type {ReactNode } from "react";
import { ConfirmDeleteModal } from "../../projects/components/ConfirmDeleteModal";

type ConfirmOptions = {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
};

type ConfirmContextType = {
  openConfirm: (options: ConfirmOptions) => void;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const openConfirm = (opts: ConfirmOptions) => {
    setOptions({
      title: "Confirm",
      confirmText: "Confirm",
      cancelText: "Cancel",
      ...opts,
    });
  };

  const handleConfirm = async () => {
    if (!options) return;

    setIsLoading(true);
    try {
      await options.onConfirm();
      setOptions(null); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (isLoading) return;
    setOptions(null);
  };

  return (
    <ConfirmContext.Provider value={{ openConfirm }}>
      {children}

      {options && (
        <ConfirmDeleteModal
          isOpen={true}
          title={options.title!}
          message={options.message}
          confirmText={options.confirmText!}
          cancelText={options.cancelText!}
          isLoading={isLoading}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm must be used within ConfirmProvider");
  }
  return context;
}