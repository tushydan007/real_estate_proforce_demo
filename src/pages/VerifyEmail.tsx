

const VerifyEmail = () => {
  // Often dj-rest-auth will send a link for verification (frontend may not need to POST).
  // If dj-rest-auth uses POST /api/auth/registration/verify-email/ expecting a key, you can implement a small form.
  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Verify your email</h2>
      <p className="bg-white p-6 rounded shadow">
        Check your email and click the verification link. If you didn't receive
        an email, try resending it from the backend endpoint.
      </p>
    </div>
  );
};

export default VerifyEmail;
