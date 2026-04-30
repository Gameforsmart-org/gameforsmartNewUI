export function JoinLoadingScreen() {
  return (
    <div className="base-background flex min-h-screen flex-col items-center justify-center">
      <div className="mb-6 flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-orange-200">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
      <h2 className="mb-2 text-center text-2xl font-bold text-orange-900">Joining Game...</h2>
      <p className="text-center text-orange-700">
        Please wait while we connect you to the session.
      </p>
    </div>
  );
}
