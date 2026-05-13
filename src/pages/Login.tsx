import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { LogIn, UserPlus } from 'lucide-react';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Preencha email e senha.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      navigate('/');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
         setError('Este email já está cadastrado.');
      } else if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
         setError('Credenciais inválidas.');
      } else if (err.code === 'auth/weak-password') {
         setError('A senha deve ter pelo menos 6 caracteres.');
      } else if (err.code === 'auth/operation-not-allowed') {
         setError('O login por E-mail e Senha não está habilitado. Você precisa habilitá-lo no console do Firebase (Authentication > Sign-in method).');
      } else {
         setError(`Erro: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setError(`Erro no login com Google: ${err.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=2070&auto=format&fit=crop)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/60 z-0"></div>
      
      <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl w-full max-w-md p-8 relative z-10">
        <div className="flex flex-col items-center mb-8">
          <img src="/logo.png" alt="Adega Master Logo" className="h-24 w-auto object-contain drop-shadow-md mb-4" />
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest text-center">
            {isLogin ? 'Acesso ao Sistema' : 'Novo Cadastro'}
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">
            {isLogin ? 'Faça login para gerenciar sua Adega.' : 'Crie sua conta para acessar a plataforma.'}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r">
            <p className="text-red-700 text-sm font-bold">{error}</p>
          </div>
        )}

        <form onSubmit={handleEmailAuth} className="space-y-5">
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1">E-mail</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-bold text-slate-800"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-600 uppercase tracking-widest mb-1">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all font-bold text-slate-800"
              placeholder="••••••••"
            />
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-red-800 hover:bg-red-700 text-white font-black uppercase tracking-widest py-4 rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {loading ? 'Aguarde...' : (isLogin ? <><LogIn size={18} /> Entrar</> : <><UserPlus size={18} /> Cadastrar</>)}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500 font-bold uppercase text-[10px] tracking-widest">Ou continue com</span>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 font-black uppercase tracking-widest py-3 rounded-lg shadow-sm transition-all flex justify-center items-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
                <path d="M1 1h22v22H1z" fill="none" />
              </svg>
              Google
            </button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm">
          <button 
            type="button" 
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-red-700 hover:text-red-900 font-bold hover:underline"
          >
            {isLogin ? 'Não tem uma conta? Crie aqui.' : 'Já tem uma conta? Faça login.'}
          </button>
        </div>
      </div>
    </div>
  );
}
