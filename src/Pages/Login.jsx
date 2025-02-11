import { auth } from "../Config/Firebase";
import {
  fetchSignInMethodsForEmail,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

import {
  getFirestore,
  getDocs,
  where,
  query,
  collection,
  addDoc,
} from "firebase/firestore";

import { useState } from "react";
import { Lock, User, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const Login = () => {
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    username: "",
  });
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const db = getFirestore();

  // check if username exists
  const checkUsernameExists = async (username) => {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", username.toLowerCase()));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    try {
      const signInMethods = await fetchSignInMethodsForEmail(
        auth,
        formData.email
      );
      if (signInMethods === 0) {
        setError("No account exists with this email address");
        return;
      }
      await sendPasswordResetEmail(auth, formData.email);
      setError("Password reset has been sent to email");
    } catch (error) {
      setError(error.message);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear any previous errors when user starts typing
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      if (isLogin) {
        // Login
        await signInWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        navigate("/");
      } else {
        // usernamme length validation
        if (formData.username.length < 7 || formData.username.length > 14) {
          setError("username must be between 7 and 14 characters");
        }

        // verify username
        const verifyUsername = await checkUsernameExists(formData.username);
        if (verifyUsername) {
          setError("username already taken");
          return;
        }

        // Registration
        const { user } = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        // update profile
        await updateProfile(user, { displayName: formData.username });

        //store username in firbase
        const usersRef = collection(db, "users");
        await addDoc(usersRef, {
          uid: user.uid,
          username: formData.username.toLowerCase(),
          email: formData.email,
          createddAt: new Date(),
        });

        navigate("/");
      }
    } catch (error) {
      const errorMessage =
        {
          "auth/user-not-found": "User not found",
          "auth/wrong-password": "Invalid password",
          "auth/invalid-email": "Invalid Email",
          "auth/invalid-credential": "Invalid password or Email",
          "auth/email-already-in-use": "Email already registered",
          "auth/weak-password": "Password should be at least 6 characters",
          "auth/network-request-failed": "Network Error",
        }[error.code] || error.message;
      setError(errorMessage);
      console.error("Authentication error", error);
    }
  };

  if (isForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 p-4">
        <div className="w-full max-w-md bg-white/30 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-8">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            Reset Password
          </h2>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 p-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              Send Reset Email
            </button>

            <button
              type="button"
              onClick={() => setIsForgotPassword(false)}
              className="w-full text-blue-700 hover:underline mt-2"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-200 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/30 backdrop-blur-lg border border-white/20 shadow-2xl rounded-2xl p-8 relative overflow-hidden">
          {/* Blurred Background Effect */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-900 rounded-full blur-3xl opacity-50"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-900 rounded-full blur-3xl opacity-50"></div>

          <h2 className="text-3xl font-bold text-center text-gray-800 mb-6">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>

          {error && (
            <div
              className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4"
              role="alert"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <div className="relative flex items-center justify-center">
                  <User className="absolute left-3 top-1/2  -translate-y-1/2 text-gray-500 pointer-events-none" />
                  <input
                    type="text"
                    name="username"
                    placeholder="Username"
                    value={formData.username}
                    onChange={handleChange}
                    autoComplete="username"
                    className="w-full pl-10 p-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Username must be between 7 and 14 characters
                </p>
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
                className="w-full pl-10 p-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                aria-current={true}
                autoComplete="current-password"
                className="w-full pl-10 p-3 bg-white/50 backdrop-blur-sm border border-white/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
            >
              {isLogin ? "Login" : "Sign Up"}
            </button>
          </form>

          <div className="text-center mt-4 space-y-4 ">
            {isLogin && (
              <button
                onClick={() => setIsForgotPassword(true)}
                className="text-blue-700 pr-3 hover:underline"
              >
                Forgot Password?
              </button>
            )}

            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-blue-700 hover:underline"
            >
              {isLogin
                ? "Need an account? Sign Up"
                : "Already have an account? Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
