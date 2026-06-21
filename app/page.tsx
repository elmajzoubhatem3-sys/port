export default function PaymentLockScreen() {
  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-zinc-900 border border-orange-500 rounded-3xl p-10 text-center shadow-2xl">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-orange-500 flex items-center justify-center">
          <span className="text-4xl">🔒</span>
        </div>

        <h1 className="text-3xl font-bold text-white mb-3">
          Account Suspended
        </h1>

        <p className="text-zinc-300 mb-6 leading-7">
          This system has been temporarily suspended due to an unpaid invoice.
          Please contact the software provider to restore access.
        </p>

        <div className="bg-zinc-800 rounded-xl p-4 mb-6">
          <p className="text-orange-400 font-semibold text-lg">
            Spark Solutions
          </p>
          <p className="text-zinc-400">
            Software Development & Business Solutions
          </p>
        </div>

        <a
          href="https://wa.me/961XXXXXXXX"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition"
        >
          Contact Software Company
        </a>
      </div>
    </div>
  );
}