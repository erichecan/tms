import React from 'react';

const LayoutTest: React.FC = () => {
  return (
    <div style={{ margin: '0 0 0 24px', padding: '20px' }}>
      <h1>布局测试页面</h1>
      <p>这是一个空白测试页面，用于验证左侧导航和右侧内容的间距布局。</p>
      <div style={{ 
        width: '100%', 
        height: '400px', 
        backgroundColor: '#f0f0f0', 
        border: '2px dashed #ccc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <span style={{ color: '#666', fontSize: '18px' }}>内容区域</span>
      </div>
    </div>
  );
};

export default LayoutTest;