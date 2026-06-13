"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Icon } from "@/components/ui/Icon";

type UndoToastItem = {
  id: string;
  label: string;
  expiresAt: number;
  onUndo: () => Promise<void> | void;
  onExpire: () => Promise<void> | void;
};

type DeleteUndoToastContextValue = {
  showUndo: (item: Omit<UndoToastItem, "expiresAt"> & { durationMs?: number }) => void;
  dismissUndo: (id: string) => void;
};

const DeleteUndoToastContext = createContext<DeleteUndoToastContextValue | null>(null);

export function DeleteUndoToastProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<UndoToastItem | null>(null);
  const undoButtonRef = useRef<HTMLButtonElement | null>(null);

  const dismissUndo = useCallback((id: string) => {
    setItem((current) => (current?.id === id ? null : current));
  }, []);

  const showUndo = useCallback(
    ({
      durationMs = 10_000,
      ...nextItem
    }: Omit<UndoToastItem, "expiresAt"> & { durationMs?: number }) => {
      setItem({
        ...nextItem,
        expiresAt: Date.now() + durationMs,
      });
    },
    [],
  );

  useEffect(() => {
    if (!item) {
      return;
    }

    undoButtonRef.current?.focus();
    const timeout = window.setTimeout(() => {
      void item.onExpire();
      setItem((current) => (current?.id === item.id ? null : current));
    }, Math.max(0, item.expiresAt - Date.now()));

    return () => {
      window.clearTimeout(timeout);
    };
  }, [item]);

  const value = useMemo(
    () => ({
      dismissUndo,
      showUndo,
    }),
    [dismissUndo, showUndo],
  );

  return (
    <DeleteUndoToastContext.Provider value={value}>
      {children}
      {item ? (
        <div className="fixed bottom-24 left-4 right-4 z-[90] md:left-auto md:right-6 md:w-[360px]">
          <div
            className="rounded-2xl bg-[#191c1d] px-4 py-4 text-white shadow-2xl"
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                <Icon name="delete" size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{item.label}</p>
                <p className="mt-1 text-sm text-white/75">
                  You can restore it for the next 10 seconds.
                </p>
              </div>
              <button
                ref={undoButtonRef}
                type="button"
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#191c1d]"
                onClick={() => {
                  void item.onUndo();
                  dismissUndo(item.id);
                }}
              >
                Undo
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </DeleteUndoToastContext.Provider>
  );
}

export function useDeleteUndoToast() {
  const context = useContext(DeleteUndoToastContext);

  if (!context) {
    throw new Error("useDeleteUndoToast must be used inside DeleteUndoToastProvider.");
  }

  return context;
}
