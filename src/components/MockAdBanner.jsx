import React from 'react';

const MockAdBanner = () => {
  const bannerStyle = {
    position: 'fixed',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '50px',
    backgroundColor: '#f8f8f8',
    borderTop: '1px solid #e0e0e0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    fontSize: '14px',
    color: '#666',
    zIndex: 40,
    paddingBottom: 'env(safe-area-inset-bottom, 0px)', // 支援 iOS 底部安全區域
    boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)'
  };

  return (
    <div style={bannerStyle}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span style={{ marginRight: '8px', display: 'inline-block', width: '16px', height: '16px', backgroundColor: '#ff7700', borderRadius: '4px' }}></span>
        模擬橫幅廣告
      </div>
    </div>
  );
};

export default MockAdBanner; 