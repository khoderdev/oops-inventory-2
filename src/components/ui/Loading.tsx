import { Loader2 } from "lucide-react";

export const Loading = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-gray-600">Loading... Please wait</p>
      </div>
    </div>
  );
};