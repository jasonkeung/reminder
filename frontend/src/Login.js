import { auth } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const provider = new GoogleAuthProvider();

const loginWithGoogle = async (onLoginSuccess) => {
  try {
    const result = await signInWithPopup(auth, provider);
    console.log("User logged in:", result.user);
    const idToken = await result.user.getIdToken();
    onLoginSuccess(idToken);
  } catch (error) {
    console.error("Login failed:", error);
  }
};

export default function Login({ onLoginSuccess }) {
  return <button onClick={() => loginWithGoogle(onLoginSuccess)}>Login with Google</button>;
}
