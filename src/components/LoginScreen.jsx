import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ShieldCheck, X, UserCheck, AlertCircle } from 'lucide-react';

export default function LoginScreen({
  loginUserid,
  setLoginUserid,
  loginPassword,
  setLoginPassword,
  handleGlobalLogin,
  loginLoading,
  loginError,
  showToast
}) {
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('login_remember') === 'true';
  });

  const [emailFocused, setEmailFocused] = useState(false);
  const [passFocused, setPassFocused] = useState(false);
  const [activeModal, setActiveModal] = useState(null); // 'forgot' | 'register' | null

  useEffect(() => {
    localStorage.setItem('login_remember', rememberMe);
  }, [rememberMe]);

  const onSubmitForm = (e) => {
    e.preventDefault();
    if (rememberMe) {
      localStorage.setItem('loginUserid', loginUserid);
    }
    handleGlobalLogin(e);
  };

  const isEmailActive = emailFocused || (loginUserid && loginUserid.length > 0);
  const isPassActive = passFocused || (loginPassword && loginPassword.length > 0);

  return (
    <div className="vibrant-login-bg">
      {/* Centered Glassmorphic Login Container Card */}
      <div 
        className="login-glass-card"
        style={{
          position: 'relative',
          zIndex: 10,
          background: 'rgba(255, 255, 255, 0.05)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.28)',
          borderRadius: '30px',
          padding: '48px 42px 42px 42px',
          width: '100%',
          maxWidth: '410px',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.75)',
          boxSizing: 'border-box',
          animation: 'modal-pop 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Title */}
        <h1 style={{
          fontSize: '32px',
          fontWeight: '700',
          color: '#ffffff',
          textAlign: 'center',
          marginBottom: '34px',
          letterSpacing: '-0.3px',
          fontFamily: "'Plus Jakarta Sans', sans-serif"
        }}>
          Login
        </h1>

        {/* Error Feedback Display */}
        {loginError && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.25)',
            border: '1px solid rgba(239, 68, 68, 0.6)',
            borderRadius: '12px',
            padding: '10px 14px',
            marginBottom: '20px',
            color: '#ffffff',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(239, 68, 68, 0.2)'
          }}>
            <AlertCircle size={16} color="#fca5a5" style={{ flexShrink: 0 }} />
            <span>{loginError}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={onSubmitForm} style={{ textAlign: 'left' }}>
          {/* Email / User ID Input Field with Underline and Floating Label */}
          <div style={{
            position: 'relative',
            width: '100%',
            marginBottom: '32px',
            borderBottom: '2px solid #ffffff'
          }}>
            <label
              style={{
                position: 'absolute',
                left: '5px',
                top: isEmailActive ? '-12px' : '12px',
                transform: isEmailActive ? 'scale(0.85)' : 'none',
                transformOrigin: 'left',
                color: '#ffffff',
                fontSize: '15.5px',
                fontWeight: '500',
                pointerEvents: 'none',
                transition: 'all 0.25s ease',
                letterSpacing: '0.01em',
                userSelect: 'none'
              }}
            >
              Email
            </label>
            <input
              type="text"
              value={loginUserid}
              onChange={(e) => setLoginUserid(e.target.value)}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
              required
              autoComplete="username"
              placeholder=""
              style={{
                width: '100%',
                height: '46px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '15.5px',
                padding: '0 35px 0 5px',
                boxSizing: 'border-box'
              }}
            />
            <div style={{
              position: 'absolute',
              right: '6px',
              top: '14px',
              color: '#ffffff',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Mail size={18} strokeWidth={2.2} />
            </div>
          </div>

          {/* Password Input Field with Underline and Floating Label */}
          <div style={{
            position: 'relative',
            width: '100%',
            marginBottom: '20px',
            borderBottom: '2px solid #ffffff'
          }}>
            <label
              style={{
                position: 'absolute',
                left: '5px',
                top: isPassActive ? '-12px' : '12px',
                transform: isPassActive ? 'scale(0.85)' : 'none',
                transformOrigin: 'left',
                color: '#ffffff',
                fontSize: '15.5px',
                fontWeight: '500',
                pointerEvents: 'none',
                transition: 'all 0.25s ease',
                letterSpacing: '0.01em',
                userSelect: 'none'
              }}
            >
              Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              value={loginPassword}
              onChange={(e) => setLoginPassword(e.target.value)}
              onFocus={() => setPassFocused(true)}
              onBlur={() => setPassFocused(false)}
              required
              autoComplete="current-password"
              placeholder=""
              style={{
                width: '100%',
                height: '46px',
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#ffffff',
                fontSize: '15.5px',
                padding: '0 35px 0 5px',
                boxSizing: 'border-box'
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              title={showPassword ? "Hide password" : "Show password"}
              style={{
                position: 'absolute',
                right: '4px',
                top: '14px',
                background: 'none',
                border: 'none',
                color: '#ffffff',
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                alignItems: 'center'
              }}
            >
              {showPassword ? (
                <EyeOff size={18} strokeWidth={2.2} />
              ) : (
                <Lock size={18} strokeWidth={2.2} />
              )}
            </button>
          </div>

          {/* Remember Me & Forgot Password Row */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            fontSize: '13.5px',
            color: '#ffffff'
          }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#ffffff',
              cursor: 'pointer',
              userSelect: 'none',
              fontWeight: '500'
            }}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                style={{
                  accentColor: '#ffffff',
                  width: '15px',
                  height: '15px',
                  cursor: 'pointer'
                }}
              />
              <span>Remember me</span>
            </label>

            <button
              type="button"
              onClick={() => setActiveModal('forgot')}
              style={{
                background: 'none',
                border: 'none',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: '500',
                cursor: 'pointer',
                textDecoration: 'none',
                padding: 0
              }}
              onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
              onMouseOut={(e) => e.target.style.textDecoration = 'none'}
            >
              Forgot Password?
            </button>
          </div>

          {/* Solid White Pill Login Button */}
          <button
            type="submit"
            disabled={loginLoading}
            style={{
              width: '100%',
              height: '46px',
              background: '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loginLoading ? 'not-allowed' : 'pointer',
              outline: 'none',
              boxShadow: '0 4px 18px rgba(0, 0, 0, 0.3)',
              transition: 'all 0.2s ease',
              opacity: loginLoading ? 0.8 : 1,
              letterSpacing: '0.01em'
            }}
            onMouseOver={(e) => !loginLoading && (e.currentTarget.style.transform = 'scale(1.015)')}
            onMouseOut={(e) => !loginLoading && (e.currentTarget.style.transform = 'scale(1)')}
          >
            {loginLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Register Account Row */}
        <div style={{
          marginTop: '22px',
          textAlign: 'center',
          fontSize: '13.5px',
          color: '#ffffff',
          fontWeight: '400'
        }}>
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => setActiveModal('register')}
            style={{
              background: 'none',
              border: 'none',
              color: '#ffffff',
              fontWeight: '700',
              cursor: 'pointer',
              fontSize: '13.5px',
              padding: 0,
              textDecoration: 'none'
            }}
            onMouseOver={(e) => e.target.style.textDecoration = 'underline'}
            onMouseOut={(e) => e.target.style.textDecoration = 'none'}
          >
            Register
          </button>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {activeModal === 'forgot' && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-content" style={{ maxWidth: '440px', padding: '28px', textAlign: 'center', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '20px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(56, 189, 248, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              border: '1px solid rgba(56, 189, 248, 0.3)'
            }}>
              <ShieldCheck size={30} color="#38bdf8" />
            </div>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc', marginBottom: '8px' }}>
              Password Reset Instructions
            </h3>
            <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px' }}>
              To ensure database security, password resets must be authorized by the Finance Administrator. Please contact:
            </p>
            <div style={{
              background: 'rgba(2, 6, 23, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              textAlign: 'left',
              marginBottom: '24px',
              fontSize: '13px',
              color: '#e2e8f0'
            }}>
              <div style={{ fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
                Ariful Islam (AGM Finance)
              </div>
              <div>Gazipur PBS-2 Record Keeping Vault</div>
              <div style={{ color: '#38bdf8', fontWeight: '600', marginTop: '6px' }}>
                Phone / Cell: 01737530731
              </div>
            </div>
            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setActiveModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Register Account Modal */}
      {activeModal === 'register' && (
        <div className="modal-overlay" style={{ zIndex: 100 }}>
          <div className="modal-content" style={{ maxWidth: '460px', padding: '28px', background: 'rgba(15, 23, 42, 0.95)', border: '1px solid rgba(255, 255, 255, 0.2)', borderRadius: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserCheck size={22} color="#00ff66" />
                <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#f8fafc', margin: 0 }}>
                  System Registration
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModal(null)}
                style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>
            
            <p style={{ fontSize: '13.5px', color: '#94a3b8', lineHeight: '1.6', marginBottom: '20px' }}>
              Access to Gazipur PBS-2 Fund Management System is restricted to authorized PBS-2 finance and accounts personnel.
            </p>

            <div style={{
              background: 'rgba(2, 6, 23, 0.7)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '24px',
              fontSize: '13px',
              color: '#e2e8f0'
            }}>
              <div style={{ fontWeight: '700', color: '#ffffff', marginBottom: '4px' }}>
                Account Provisioning & Credentials
              </div>
              <div style={{ color: '#94a3b8', lineHeight: '1.5' }}>
                New operator accounts and passwords are assigned exclusively by Samity Management. Please contact AGM (Finance) to register your terminal.
              </div>
              <div style={{ color: '#38bdf8', fontWeight: '600', marginTop: '8px' }}>
                Contact: Ariful Islam &bull; Cell: 01737530731
              </div>
            </div>

            <button
              type="button"
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => setActiveModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
