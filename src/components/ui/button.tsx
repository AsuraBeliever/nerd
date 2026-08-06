import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const button = cva(
  "inline-flex items-center justify-center gap-2 rounded-control font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent text-accent-fg hover:bg-accent-hover",
        secondary: "border border-border bg-surface text-text hover:bg-surface-subtle",
        ghost: "text-text-secondary hover:bg-surface-subtle hover:text-text",
        danger: "border border-border text-danger hover:bg-surface-subtle",
      },
      size: {
        // 44px de alto mínimo en los tamaños táctiles: área de toque cómoda.
        sm: "h-8 px-2.5 text-[13px]",
        md: "h-11 px-4 text-[15px]",
        icon: "size-11",
        iconSm: "size-8",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof button>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={cn(button({ variant, size }), className)} {...props} />;
}

export { button as buttonVariants };
