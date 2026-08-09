import { AlertTriangle, LoaderCircle, Search, X, type LucideIcon } from "lucide-react";
import {
  forwardRef,
  useEffect,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Link } from "react-router";

type ButtonVariant = "primary" | "secondary" | "danger" | "ghost";

export function Button({
  variant = "primary",
  loading,
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; loading?: boolean }) {
  return (
    <button className={`btn btn-${variant} ${className}`} disabled={props.disabled || loading} {...props}>
      {loading && <LoaderCircle size={16} className="spin" />}
      {children}
    </button>
  );
}

export function LinkButton({ to, children, variant = "primary" }: { to: string; children: ReactNode; variant?: ButtonVariant }) {
  return (
    <Link to={to} className={`btn btn-${variant}`}>
      {children}
    </Link>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(({ className = "", ...props }, ref) => (
  <input ref={ref} className={`input ${className}`} {...props} />
));
Input.displayName = "Input";

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(({ className = "", ...props }, ref) => (
  <select ref={ref} className={`input select ${className}`} {...props} />
));
Select.displayName = "Select";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className = "", ...props }, ref) => (
  <textarea ref={ref} className={`input textarea ${className}`} {...props} />
));
Textarea.displayName = "Textarea";

export function Field({ label, required, error, hint, children }: { label: string; required?: boolean; error?: string; hint?: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">
        {label} {required && <b aria-hidden="true">*</b>}
      </span>
      {children}
      {error ? <span className="field-error">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}
    </label>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function SearchInput({ value, onChange, placeholder = "Tìm kiếm..." }: { value: string; onChange: (value: string) => void; placeholder?: string }) {
  return (
    <div className="search-input">
      <Search size={17} />
      <input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} />
      {value && (
        <button type="button" onClick={() => onChange("")} aria-label="Xóa tìm kiếm">
          <X size={15} />
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon: Icon = Search, title, description, action }: { icon?: LucideIcon; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="empty-state">
      <span className="empty-icon"><Icon size={24} /></span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="empty-state error-state" role="alert">
      <span className="empty-icon"><AlertTriangle size={24} /></span>
      <h3>Không tải được dữ liệu</h3>
      <p>{message}</p>
      {onRetry && <Button variant="secondary" onClick={onRetry}>Thử lại</Button>}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="page-loader" aria-label="Đang tải">
      <LoaderCircle size={28} className="spin" />
    </div>
  );
}

export function SkeletonRows({ count = 5 }: { count?: number }) {
  return <div className="skeleton-list">{Array.from({ length: count }, (_, index) => <div className="skeleton-row" key={index} />)}</div>;
}

export function Pagination({ meta, onPage }: { meta: { page: number; totalPages: number; totalItems: number }; onPage: (page: number) => void }) {
  if (meta.totalPages <= 1) return null;
  return (
    <div className="pagination">
      <span>{meta.totalItems.toLocaleString("vi-VN")} kết quả</span>
      <div>
        <Button variant="secondary" disabled={meta.page <= 1} onClick={() => onPage(meta.page - 1)}>Trước</Button>
        <span>Trang {meta.page}/{meta.totalPages}</span>
        <Button variant="secondary" disabled={meta.page >= meta.totalPages} onClick={() => onPage(meta.page + 1)}>Sau</Button>
      </div>
    </div>
  );
}

export function Modal({ open, title, description, children, onClose }: { open: boolean; title: string; description?: string; children: ReactNode; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-header">
          <div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div>
          <button className="icon-button" onClick={onClose} aria-label="Đóng"><X size={19} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
