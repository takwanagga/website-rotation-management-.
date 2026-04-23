export default function LoadingScreen({ message = "Chargement…" }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-gray-600">
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
}
