function Unauthorized() {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center select-none bg-gray-100">
      <div className="text-center px-6 max-w-md">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">401 Unauthorized</h1>
        <p className="text-gray-600 text-lg mb-8">
          You don't have permission to access this page.
        </p>
        <button
          onClick={() => window.location.href = '/login'}
          className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
        >
          Go to Login
        </button>
      </div>
    </div>
  )
}

export default Unauthorized