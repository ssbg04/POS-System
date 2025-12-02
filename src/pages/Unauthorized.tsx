import { AlertTriangle } from "lucide-react";

const Unauthorized = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50">
    <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
    <h1 className="text-2xl font-bold text-slate-800">403 - Access Denied</h1>
  </div>
);

export default Unauthorized;
