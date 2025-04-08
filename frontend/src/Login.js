import { auth } from './firebase';
import { api } from './api';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const provider = new GoogleAuthProvider();

const loginWithGoogle = async (onLoginSuccess) => {
  try {
    const result = await signInWithPopup(auth, provider);
    const idToken = await result.user.getIdToken();
    api.postLogin(idToken, (response) => onLoginSuccess(idToken, response))
  } catch (error) {
    console.error("Login failed:", error);
  }
};

export default function Login({ user, onLoginSuccess, loginCount }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: '10px',
        right: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: '10px',
      }}>
      <button onClick={() => loginWithGoogle(onLoginSuccess)}>Login with Google</button>

      {user && user.picture && (
        <>
          <span>{user ? loginCount + " " : ""}{user.email}</span>
          <img
            src={user.picture}
            alt="Profile"
            style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
            }}
          />
        </>
      )}
    </div>
  );
}
