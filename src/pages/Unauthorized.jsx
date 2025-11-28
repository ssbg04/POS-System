function Unauthorized() {
  return (
    <div className="d-flex flex-column justify-content-center align-items-center min-vh-100 bg-light select-none">
      <div className="text-center px-3" style={{ maxWidth: "420px" }}>
        <h1 className="display-5 fw-bold text-dark mb-3">401 Unauthorized</h1>

        <p className="text-secondary fs-5 mb-4">
          You don't have permission to access this page.
        </p>

        <button
          onClick={() => (window.location.href = "/login")}
          className="btn btn-primary px-4 py-2"
        >
          Go to Login
        </button>
      </div>
    </div>
  );
}

export default Unauthorized;
