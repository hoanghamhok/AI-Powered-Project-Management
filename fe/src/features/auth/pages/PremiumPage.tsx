import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import {
  X,
  CheckCircle,
  Copy,
  AlertTriangle,
  Loader2,
  Crown,
  CreditCard,
  Bot,
  TrendingUp,
  FileText,
  Headphones,
  Check,
} from 'lucide-react';

/* ─── Types ─────────────────────────────────────────── */
interface PaymentInfo {
  qrUrl: string;
  orderId: string;
}

type PollingStatus = 'pending' | 'success' | 'failed';

/* ─── Feature list ───────────────────────────────────── */
const FEATURES = [
  {
    icon: Bot,
    color: 'purple',
    name: 'AI Chatbot Assistant',
    desc: 'Giải đáp thắc mắc và gợi ý công việc thông minh',
  },
  {
    icon: TrendingUp,
    color: 'teal',
    name: 'Risk Prediction',
    desc: 'Dự đoán rủi ro cho các đầu việc trước khi xảy ra',
  },
  {
    icon: FileText,
    color: 'amber',
    name: 'Project Summarizer',
    desc: 'Tóm tắt tiến độ dự án tự động, tiết kiệm thời gian',
  },
  {
    icon: Headphones,
    color: 'coral',
    name: 'Premium Support',
    desc: 'Hỗ trợ ưu tiên 24/7 từ đội ngũ chuyên gia',
  },
] as const;

/* ─── Color map for feature icons ───────────────────── */
const ICON_COLORS: Record<string, { bg: string; fg: string }> = {
  purple: { bg: '#EEEDFE', fg: '#534AB7' },
  teal:   { bg: '#E1F5EE', fg: '#0F6E56' },
  amber:  { bg: '#FAEEDA', fg: '#854F0B' },
  coral:  { bg: '#FAECE7', fg: '#993C1D' },
};

/* ═══════════════════════════════════════════════════════
   PremiumPage
═══════════════════════════════════════════════════════ */
export const PremiumPage: React.FC = () => {
  const user         = useAuth((s) => s.user);
  const fetchProfile = useAuth((s) => s.fetchProfile);
  const navigate     = useNavigate();

  const [loading,       setLoading]       = useState(false);
  const [paymentInfo,   setPaymentInfo]   = useState<PaymentInfo | null>(null);
  const [pollingStatus, setPollingStatus] = useState<PollingStatus>('pending');
  const [copied,        setCopied]        = useState(false);

  /* ── Initiate payment ─────────────────────────────── */
  const handleUpgrade = async () => {
    if (!user) { navigate('/login'); return; }
    setLoading(true);
    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const token  = localStorage.getItem('token');
      const { data } = await axios.post(
        `${apiUrl}/payment/create`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (data?.qrUrl) {
        setPaymentInfo({ qrUrl: data.qrUrl, orderId: data.orderId });
        setPollingStatus('pending');
        return;
      }
      alert(data?.message || 'Không thể tạo yêu cầu thanh toán');
    } catch {
      alert('Không thể tạo giao dịch. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  /* ── Polling ──────────────────────────────────────── */
  useEffect(() => {
    if (!paymentInfo || pollingStatus !== 'pending') return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const token  = localStorage.getItem('token');

    const interval = setInterval(async () => {
      try {
        const { data } = await axios.get(
          `${apiUrl}/payment/status/${paymentInfo.orderId}`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        if (data.status === 'SUCCESS') {
          setPollingStatus('success');
          clearInterval(interval);
          if (fetchProfile) await fetchProfile();
          setTimeout(() => {
            navigate(`/payment-result?orderId=${paymentInfo.orderId}&status=success`);
          }, 2000);
        } else if (data.status === 'FAILED') {
          setPollingStatus('failed');
          clearInterval(interval);
        }
      } catch {
        /* silent – will retry on next tick */
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [paymentInfo, pollingStatus, navigate, fetchProfile]);

  /* ── Copy helper ──────────────────────────────────── */
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  /* ── Render ───────────────────────────────────────── */
  return (
    <>
      {/* Google Fonts – DM Serif Display + DM Sans */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
      `}</style>

      <div style={styles.root}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          style={styles.card}
        >
          {/* ── Hero ─────────────────────────────────── */}
          <div style={styles.hero}>
            <div style={styles.badge}>
              <Crown size={11} strokeWidth={2.5} />
              Premium
            </div>

            <h1 style={styles.heroTitle}>
              Nâng cấp<br />
              <em>tài khoản</em> của bạn
            </h1>
            <p style={styles.heroSub}>
              Mở khóa toàn bộ sức mạnh AI để tăng tốc công việc
            </p>

            <div style={styles.priceRow}>
              <span style={styles.priceNum}>2.000đ</span>
              <span style={styles.pricePer}>&nbsp;/ tháng</span>
            </div>
          </div>

          {/* ── Body ─────────────────────────────────── */}
          <div style={styles.body}>
            <p style={styles.sectionLabel}>Tính năng bao gồm</p>

            <div style={styles.featureList}>
              {FEATURES.map(({ icon: Icon, color, name, desc }) => (
                <FeatureRow key={name} Icon={Icon} color={color} name={name} desc={desc} />
              ))}
            </div>

            <hr style={styles.divider} />

            <button
              onClick={handleUpgrade}
              disabled={loading || !!user?.isPremium}
              style={{
                ...styles.btnPrimary,
                opacity: loading || user?.isPremium ? 0.45 : 1,
                cursor:  loading || user?.isPremium ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? (
                <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
              ) : (
                <CreditCard size={16} />
              )}
              {loading
                ? 'Đang xử lý…'
                : user?.isPremium
                  ? 'Đã là Premium ✓'
                  : 'Thanh toán chuyển khoản'}
            </button>

            <button onClick={() => navigate(-1)} style={styles.btnSecondary}>
              Quay lại
            </button>

            <p style={styles.legal}>
              Bằng cách nâng cấp, bạn đồng ý với{' '}
              <a href="#" style={styles.legalLink}>Điều khoản dịch vụ</a>
              {' '}và{' '}
              <a href="#" style={styles.legalLink}>Chính sách bảo mật</a>.
            </p>
          </div>

          {/* ── Payment Overlay ───────────────────────── */}
          <AnimatePresence>
            {paymentInfo && (
              <motion.div
                key="overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                style={styles.overlay}
              >
                {/* overlay header */}
                <div style={styles.overlayHead}>
                  <p style={styles.overlayTitle}>
                    {pollingStatus === 'success' ? 'Thanh toán thành công' : 'Quét mã để thanh toán'}
                  </p>
                  <button
                    onClick={() => setPaymentInfo(null)}
                    style={styles.closeBtn}
                    aria-label="Đóng"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* overlay body */}
                <div style={styles.overlayBody}>
                  {pollingStatus === 'success' ? (
                    /* Success state */
                    <motion.div
                      initial={{ scale: 0.85, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      style={styles.successState}
                    >
                      <div style={styles.successIcon}>
                        <CheckCircle size={32} color="#0F6E56" />
                      </div>
                      <p style={styles.successTitle}>Chúc mừng!</p>
                      <p style={styles.successSub}>
                        Tài khoản của bạn đã được nâng cấp lên Premium.
                        <br />Đang chuyển hướng…
                      </p>
                    </motion.div>
                  ) : (
                    /* Pending state */
                    <>
                      {/* QR Code */}
                      <div style={styles.qrWrap}>
                        <img
                          src={paymentInfo.qrUrl}
                          alt="QR thanh toán"
                          style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 8 }}
                        />
                      </div>

                      {/* Waiting banner */}
                      <div style={{ ...styles.infoBanner, ...styles.bannerIndigo }}>
                        <Loader2
                          size={15}
                          style={{ flexShrink: 0, animation: 'spin 0.8s linear infinite' }}
                        />
                        <span>Đang chờ hệ thống xác nhận thanh toán…</span>
                      </div>

                      {/* Warning banner */}
                      <div style={{ ...styles.infoBanner, ...styles.bannerAmber }}>
                        <AlertTriangle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
                        <span>
                          <strong>Lưu ý:</strong> Giữ nguyên nội dung chuyển khoản bên dưới để hệ thống tự nhận diện.
                        </span>
                      </div>

                      {/* Order ID */}
                      <div style={styles.copyRow}>
                        <div>
                          <p style={styles.copyLabel}>Nội dung chuyển khoản</p>
                          <p style={{ ...styles.copyVal, color: '#534AB7' }}>{paymentInfo.orderId}</p>
                        </div>
                        <button
                          onClick={() => copyToClipboard(paymentInfo.orderId)}
                          style={styles.copyBtn}
                          aria-label="Sao chép mã đơn"
                        >
                          {copied
                            ? <Check size={14} color="#0F6E56" />
                            : <Copy size={14} />}
                        </button>
                      </div>

                      {/* Amount */}
                      <div style={styles.copyRow}>
                        <div>
                          <p style={styles.copyLabel}>Số tiền</p>
                          <p style={styles.copyVal}>2.000đ</p>
                        </div>
                      </div>

                      <button
                        onClick={() => setPaymentInfo(null)}
                        style={{ ...styles.btnSecondary, marginTop: 4 }}
                      >
                        Đóng
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Keyframe for spinner */}
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </>
  );
};

/* ═══════════════════════════════════════════════════════
   FeatureRow sub-component
═══════════════════════════════════════════════════════ */
const FeatureRow: React.FC<{
  Icon: React.FC<{ size?: number; color?: string }>;
  color: string;
  name: string;
  desc: string;
}> = ({ Icon, color, name, desc }) => {
  const { bg, fg } = ICON_COLORS[color];
  return (
    <div style={styles.featureRow}>
      <div style={{ ...styles.featIcon, background: bg }}>
        <Icon size={17} color={fg} />
      </div>
      <div style={styles.featText}>
        <p style={styles.featName}>{name}</p>
        <p style={styles.featDesc}>{desc}</p>
      </div>
      <Check size={15} color="#1D9E75" strokeWidth={2.5} style={{ flexShrink: 0 }} />
    </div>
  );
};

/* ═══════════════════════════════════════════════════════
   Styles
═══════════════════════════════════════════════════════ */
const styles: Record<string, React.CSSProperties> = {
  root: {
    fontFamily: "'DM Sans', sans-serif",
    minHeight: '100vh',
    background: '#F5F4F0',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '2.5rem 1rem',
  },
  card: {
    background: '#fff',
    borderRadius: 24,
    border: '0.5px solid rgba(0,0,0,0.08)',
    width: '100%',
    maxWidth: 420,
    overflow: 'hidden',
    position: 'relative',
    boxShadow: '0 4px 32px rgba(0,0,0,0.06)',
  },

  /* Hero */
  hero: {
    padding: '2.5rem 2rem 2rem',
    textAlign: 'center',
    background: '#FAFAF8',
    borderBottom: '0.5px solid rgba(0,0,0,0.07)',
  },
  badge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: '#EEEDFE',
    color: '#3C3489',
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '5px 12px',
    borderRadius: 100,
    marginBottom: '1rem',
  },
  heroTitle: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: 28,
    color: '#1a1a1a',
    margin: '0 0 0.5rem',
    lineHeight: 1.2,
    fontWeight: 400,
  },
  heroSub: {
    fontSize: 14,
    color: '#666',
    margin: 0,
    lineHeight: 1.6,
  },
  priceRow: {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginTop: '1.25rem',
  },
  priceNum: {
    fontSize: 34,
    fontWeight: 600,
    color: '#1a1a1a',
    lineHeight: 1,
  },
  pricePer: {
    fontSize: 13,
    color: '#999',
  },

  /* Body */
  body: {
    padding: '1.75rem 2rem 2rem',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    color: '#aaa',
    margin: '0 0 1rem',
  },
  featureList: {
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    marginBottom: '1.5rem',
  },
  featureRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 12px',
    borderRadius: 10,
    cursor: 'default',
    transition: 'background 0.15s',
  },
  featIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featText: {
    flex: 1,
  },
  featName: {
    fontSize: 14,
    fontWeight: 500,
    color: '#1a1a1a',
    margin: '0 0 1px',
  },
  featDesc: {
    fontSize: 12,
    color: '#888',
    margin: 0,
    lineHeight: 1.4,
  },
  divider: {
    height: 0,
    border: 'none',
    borderTop: '0.5px solid rgba(0,0,0,0.08)',
    margin: '1.5rem 0',
  },

  /* Buttons */
  btnPrimary: {
    width: '100%',
    padding: '14px',
    borderRadius: 14,
    border: 'none',
    background: '#3C3489',
    color: '#fff',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 15,
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    letterSpacing: '0.01em',
    transition: 'opacity 0.15s',
  },
  btnSecondary: {
    width: '100%',
    padding: '12px',
    borderRadius: 14,
    border: '0.5px solid rgba(0,0,0,0.12)',
    background: 'transparent',
    color: '#888',
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    marginTop: 10,
    transition: 'background 0.15s',
  },
  legal: {
    fontSize: 11,
    color: '#bbb',
    textAlign: 'center',
    marginTop: '1.25rem',
    lineHeight: 1.6,
  },
  legalLink: {
    color: '#888',
    textDecoration: 'underline',
  },

  /* Overlay */
  overlay: {
    position: 'absolute',
    inset: 0,
    background: '#fff',
    display: 'flex',
    flexDirection: 'column',
    borderRadius: 24,
    overflow: 'hidden',
  },
  overlayHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem 1.5rem',
    borderBottom: '0.5px solid rgba(0,0,0,0.07)',
  },
  overlayTitle: {
    fontSize: 15,
    fontWeight: 600,
    color: '#1a1a1a',
    margin: 0,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: '50%',
    border: '0.5px solid rgba(0,0,0,0.1)',
    background: '#F5F4F0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    transition: 'background 0.15s',
  },
  overlayBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.875rem',
  },

  /* QR */
  qrWrap: {
    background: '#F5F4F0',
    border: '0.5px solid rgba(0,0,0,0.07)',
    borderRadius: 16,
    padding: 12,
    width: 192,
    height: 192,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Banners */
  infoBanner: {
    width: '100%',
    borderRadius: 10,
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    fontSize: 12,
    lineHeight: 1.5,
  },
  bannerIndigo: {
    background: '#EEEDFE',
    color: '#3C3489',
  },
  bannerAmber: {
    background: '#FAEEDA',
    color: '#633806',
  },

  /* Copy rows */
  copyRow: {
    width: '100%',
    background: '#F5F4F0',
    border: '0.5px solid rgba(0,0,0,0.07)',
    borderRadius: 10,
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  copyLabel: {
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#aaa',
    margin: '0 0 2px',
  },
  copyVal: {
    fontSize: 14,
    fontWeight: 600,
    fontFamily: 'monospace',
    color: '#1a1a1a',
    margin: 0,
  },
  copyBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    border: '0.5px solid rgba(0,0,0,0.1)',
    background: '#fff',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#888',
    flexShrink: 0,
    transition: 'background 0.15s, color 0.15s',
  },

  /* Success */
  successState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
    padding: '2.5rem 1rem',
  },
  successIcon: {
    width: 64,
    height: 64,
    borderRadius: '50%',
    background: '#E1F5EE',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 600,
    color: '#1a1a1a',
    margin: 0,
  },
  successSub: {
    fontSize: 13,
    color: '#888',
    margin: 0,
    lineHeight: 1.6,
  },
};