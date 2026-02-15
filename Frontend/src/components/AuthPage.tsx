import { useState } from "react";
import { User } from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";
import { createUserDoc } from "../services/userService";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);

      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // สร้าง user doc ใน Firestore (ถ้ายังไม่มี)
      await createUserDoc(user);

      alert("Login with Google สำเร็จ 🎉");
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password || (!isLogin && !name)) {
      alert("Please fill all fields");
      return;
    }

    if (!isLogin && password.length < 9) {
      alert("Password must be at least 9 characters");
      return;
    }

    if (!isLogin && password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      // 🔐 LOGIN
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password,
        );

        if (!userCredential.user.emailVerified) {
          alert("กรุณายืนยันอีเมลก่อนเข้าสู่ระบบ 📩");
          await signOut(auth);
          return;
        }

        alert("Login successful");
      }

      // 🆕 SIGN UP
      else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password,
        );

        // อัปเดตชื่อ Profile
        await updateProfile(userCredential.user, {
          displayName: name,
        });

        // 📧 ส่งเมลยืนยัน
        await sendEmailVerification(userCredential.user);

        await createUserDoc(userCredential.user);

        alert("สมัครสำเร็จ! กรุณาตรวจสอบอีเมลเพื่อยืนยันบัญชี 📩");

        setIsLogin(true);
        setConfirmPassword("");
      }
    } catch (error: any) {
      // จัดการ Error ข้อความให้อ่านง่ายขึ้น
      if (error.code === "auth/email-already-in-use") {
        alert("อีเมลนี้ถูกใช้งานแล้ว");
      } else if (error.code === "auth/wrong-password") {
        alert("รหัสผ่านไม่ถูกต้อง");
      } else {
        alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 p-4">
      <div className="glass-effect rounded-3xl shadow-2xl w-full max-w-md p-8 border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl mb-4 shadow-lg">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            FitPro
          </h1>
          <p className="text-gray-600">Your personal fitness companion</p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-3 rounded-xl ${
              isLogin
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                : "bg-white/60 hover:bg-white/80"
            }`}
          >
            Login
          </button>
          <button
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-3 rounded-xl ${
              !isLogin
                ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md"
                : "bg-white/60 hover:bg-white/80"
            }`}
          >
            Sign Up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full py-3 px-4 border rounded-xl"
              required
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full py-3 px-4 border rounded-xl"
            required
          />

          <input
            type="password"
            placeholder={
              isLogin ? "Password" : "Password (Enter at least 9 characters)"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full py-3 px-4 border rounded-xl"
            minLength={!isLogin ? 9 : undefined}
            required
          />

          {!isLogin && (
            <input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full py-3 px-4 border rounded-xl"
              required
            />
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:opacity-90 disabled:opacity-50 transition-all mt-4"
          >
            {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
          </button>
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white px-2 text-gray-500">
                or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-white border py-3 rounded-xl shadow hover:bg-gray-50 transition-all"
          >
            <img
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt="Google"
              className="w-5 h-5"
            />
            Continue with Google
          </button>
        </form>
      </div>
    </div>
  );
}
