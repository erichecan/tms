import React from 'react';

const Home: React.FC = () => {
  return (
    <div style={{ padding: '20px' }}>
      <h1>TMS 智能物流运营平台</h1>
      <p>欢迎使用TMS系统！</p>
      <button onClick={() => window.location.href = '/create-shipment'}>
        创建运单
      </button>
    </div>
  );
};

export default Home;
