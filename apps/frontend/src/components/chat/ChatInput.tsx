import type { KeyboardEvent } from "react";
import { Icon } from "@/components/ui/Icon";

type ChatInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  onSubmit: () => void;
  onAddClick?: () => void;
  placeholder?: string;
  disabled?: boolean;
};

export function ChatInput({
  value,
  onValueChange,
  onSubmit,
  onAddClick,
  placeholder = "Type a message...",
  disabled = false,
}: ChatInputProps) {
  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && !disabled) {
      onSubmit();
    }
  };

  return (
    <div
      style={{
        maxWidth: "768px",
        margin: "0 auto",
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "#ffffff",
        border: "1px solid #c2c6d6",
        padding: "8px",
        borderRadius: "9999px",
        boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      }}
    >
      {onAddClick ? (
        <button
          type="button"
          onClick={onAddClick}
          disabled={disabled}
          style={{
            background: "none",
            border: "none",
            cursor: disabled ? "default" : "pointer",
            padding: "8px",
            color: "#424754",
            transition: "color 0.2s",
            opacity: disabled ? 0.6 : 1,
          }}
          onMouseOver={(event) => {
            if (!disabled) {
              event.currentTarget.style.color = "#0058be";
            }
          }}
          onMouseOut={(event) => {
            event.currentTarget.style.color = "#424754";
          }}
        >
          <Icon name="add_circle" />
        </button>
      ) : null}

      <input
        className="chat-input"
        type="text"
        placeholder={placeholder}
        value={value}
        disabled={disabled}
        onChange={(event) => onValueChange(event.target.value)}
        onKeyDown={handleKeyDown}
        style={{
          flexGrow: 1,
          background: "transparent",
          border: "none",
          fontSize: "16px",
          lineHeight: "24px",
          color: "#191c1d",
          padding: "8px 4px",
          fontFamily: "'Inter', sans-serif",
        }}
      />

      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled}
        style={{
          width: "40px",
          height: "40px",
          backgroundColor: "#3B82F6",
          color: "#ffffff",
          borderRadius: "9999px",
          border: "none",
          cursor: disabled ? "default" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "opacity 0.15s, transform 0.1s",
          flexShrink: 0,
          opacity: disabled ? 0.6 : 1,
        }}
        onMouseOver={(event) => {
          if (!disabled) {
            event.currentTarget.style.opacity = "0.9";
          }
        }}
        onMouseOut={(event) => {
          event.currentTarget.style.opacity = disabled ? "0.6" : "1";
        }}
        onMouseDown={(event) => {
          if (!disabled) {
            event.currentTarget.style.transform = "scale(0.9)";
          }
        }}
        onMouseUp={(event) => {
          event.currentTarget.style.transform = "scale(1)";
        }}
      >
        <Icon name="send" filled size={20} />
      </button>
    </div>
  );
}

