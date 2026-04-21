interface EmptyStateProps {
  message?: string;
}

export function EmptyState({ message = "You still haven't played any quiz." }: EmptyStateProps) {
  return (
    <div className="flex h-64 items-center justify-center">
      <p className="text-muted-foreground">{message}</p>
    </div>
  );
}
