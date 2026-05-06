import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { motion } from 'framer-motion';

export const PaymentResultPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { fetchProfile } = useAuth();
  
  const status = searchParams.get('status');
  const resultCode = searchParams.get('resultCode');
  const orderId = searchParams.get('orderId');
  const message = searchParams.get('message');
  
  // Success if status is 'success' (from our polling) or resultCode is '0' (from MoMo legacy)
  const isSuccess = status === 'success' || resultCode === '0';

  useEffect(() => {
    if (isSuccess) {
      // Refresh profile to get updated isPremium status
      fetchProfile();
    }
  }, [isSuccess, fetchProfile]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center"
      >
        <div className={`text-6xl mb-6 ${isSuccess ? 'text-green-500' : 'text-red-500'}`}>
          {isSuccess ? '✅' : '❌'}
        </div>
        
        <h1 className="text-2xl font-bold mb-2">
          {isSuccess ? 'Thanh toán thành công!' : 'Thanh toán thất bại'}
        </h1>
        
        <p className="text-gray-500 mb-8">
          {isSuccess 
            ? 'Cảm ơn bạn đã nâng cấp Premium. Bạn có thể sử dụng các tính năng AI ngay bây giờ.' 
            : message || 'Đã có lỗi xảy ra trong quá trình thanh toán.'}
        </p>

        <button
          onClick={() => navigate(isSuccess ? '/' : '/premium')}
          className="w-full py-3 rounded-xl text-white font-semibold transition-all active:scale-95"
          style={{
            background: isSuccess ? '#22c55e' : '#ef4444',
            boxShadow: `0 4px 12px ${isSuccess ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
          }}
        >
          {isSuccess ? 'Về trang chủ' : 'Thử lại'}
        </button>
      </motion.div>
    </div>
  );
};
