// 地图API调试工具
// 直接在浏览器控制台运行此脚本来测试地图API

async function testMapsAPI() {
    console.log('🚀 开始测试 Google Maps API...');
    
    try {
        // 检查环境变量
        const apiKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY;
        console.log('🔑 API Key 状态:', apiKey ? '已设置' : '未设置');
        
        if (!apiKey) {
            console.error('❌ 错误: VITE_GOOGLE_MAPS_API_KEY 环境变量未设置');
            return false;
        }
        
        // 测试 Google Maps API 加载器
        const { Loader } = await import('@googlemaps/js-api-loader');
        console.log('✅ Google Maps Loader 加载成功');
        
        const loader = new Loader({
            apiKey: apiKey,
            version: 'weekly',
            libraries: ['places', 'geometry'],
        });
        
        // 测试 API 加载
        console.log('🔄 正在加载 Google Maps API...');
        const google = await loader.load();
        console.log('✅ Google Maps API 加载成功');
        
        // 测试 Geocoding 服务
        console.log('🔄 正在测试地址解析服务...');
        const geocoder = new google.maps.Geocoder();
        
        return new Promise((resolve) => {
            geocoder.geocode({ address: '3401 Dufferin St, North York, ON M6A 2T9' }, (results, status) => {
                if (status === 'OK') {
                    console.log('✅ 地址解析服务正常');
                    console.log('📍 解析结果:', results[0]);
                    resolve(true);
                } else {
                    console.error('❌ 地址解析失败:', status);
                    console.log('💡 可能的原因:');
                    console.log('   - API 密钥无效');
                    console.log('   - 计费未启用');
                    console.log('   - 权限不足');
                    resolve(false);
                }
            });
        });
        
    } catch (error) {
        console.error('💥 测试过程中发生错误:', error);
        console.log('💡 故障排除建议:');
        console.log('   1. 检查 API 密钥是否正确');
        console.log('   2. 确认 Google Cloud 项目已启用计费');
        console.log('   3. 检查网络连接');
        console.log('   4. 确认必要的 API 已启用 (Geocoding API, Maps JavaScript API)');
        return false;
    }
}

// 运行测试
testMapsAPI().then(success => {
    if (success) {
        console.log('🎉 地图API测试完成 - 所有功能正常！');
    } else {
        console.log('⚠️  地图API测试完成 - 发现问题，请查看上面的错误信息');
    }
});

// 导出函数供其他脚本使用
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testMapsAPI };
}