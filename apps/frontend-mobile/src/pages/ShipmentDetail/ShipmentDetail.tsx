// 2025-11-30T10:55:00Z Created by Assistant: 运单详情页面
// 2025-11-30T21:25:00 添加货物信息显示和BOL下载功能
// 2025-12-19 11:41:30 需求：POD 非强制；仅送达后可上传；上限 5 张
import { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { NavBar, Card, Tag, Button, Space, Skeleton, Toast, Divider, Modal } from 'antd-mobile';
import { LeftOutline, PhoneFill, EnvironmentOutline, FileOutline } from 'antd-mobile-icons'; // 2025-11-30T21:25:00 添加FileOutline图标用于下载
import { driverShipmentsApi, DRIVER_STORAGE_KEY } from '../../services/api';
import { Shipment, ShipmentStatus } from '../../types';
import PODUploader from '../../components/PODUploader/PODUploader'; // 2025-11-30T11:35:00Z Added by Assistant: POD上传组件
import { navigateToAddress, makePhoneCall, formatAddress as formatAddressUtil } from '../../services/navigationService'; // 2025-11-30T11:45:00Z Added by Assistant: 导航服务
import MapView from '../../components/MapView/MapView'; // 2025-11-30T12:10:00Z Added by Assistant: 地图组件
import BOLDocument from '../../components/BOLDocument/BOLDocument'; // 2025-11-30T21:25:00 添加BOL文档组件

const actionLabelMap: Record<string, string> = {
  pending: '确认接单',
  assigned: '开始取货',
  confirmed: '开始取货',
  picked_up: '开始运输',
  in_transit: '确认送达',
};

const statusColorMap: Record<string, string> = {
  pending: 'default',
  assigned: 'primary',
  confirmed: 'primary',
  scheduled: 'primary',
  pickup_in_progress: 'warning',
  picked_up: 'warning',
  in_transit: 'processing',
  delivered: 'success',
  completed: 'success',
  cancelled: 'danger',
  exception: 'danger',
};

const statusTextMap: Record<string, string> = {
  pending: '待接单',
  assigned: '已分配',
  confirmed: '已确认',
  scheduled: '已安排',
  pickup_in_progress: '提货中',
  picked_up: '已提货',
  in_transit: '运输中',
  delivered: '已送达',
  completed: '已完成',
  cancelled: '已取消',
  exception: '异常',
};

export default function ShipmentDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const driverId = localStorage.getItem(DRIVER_STORAGE_KEY);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null); // 2025-11-30T12:10:00Z Added by Assistant: 当前位置
  const [bolModalVisible, setBolModalVisible] = useState(false); // 2025-11-30T21:25:00 BOL预览模态框显示状态
  const bolContainerRef = useRef<HTMLDivElement>(null); // 2025-11-30T21:25:00 BOL容器引用

  useEffect(() => {
    if (!id || !driverId) {
      Toast.show({
        icon: 'fail',
        content: '参数错误',
      });
      navigate('/dashboard');
      return;
    }
    loadShipment();
    loadCurrentLocation();
  }, [id, driverId, navigate]);

  // 获取当前位置
  const loadCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn('获取当前位置失败:', error);
          // 不影响其他功能，静默失败
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    }
  }; // 2025-11-30T12:10:00Z Added by Assistant: 获取当前位置

  const loadShipment = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const response = await driverShipmentsApi.getShipment(id);
      setShipment(response.data?.data || null);
    } catch (error: any) {
      console.error('加载运单详情失败:', error);
      const errorMessage = error?.response?.data?.error?.message || '加载失败，请稍后重试';
      Toast.show({
        icon: 'fail',
        content: errorMessage,
      });
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceStatus = async () => {
    if (!shipment || !driverId) return;
    setActionLoading(true);
    try {
      switch (shipment.status) {
        case 'confirmed':
        case ShipmentStatus.ASSIGNED:
          await driverShipmentsApi.startPickup(shipment.id, driverId);
          break;
        case 'pending':
          await driverShipmentsApi.startPickup(shipment.id, driverId);
          break;
        case ShipmentStatus.PICKED_UP:
          await driverShipmentsApi.startTransit(shipment.id, driverId);
          break;
        case ShipmentStatus.IN_TRANSIT:
          await driverShipmentsApi.completeDelivery(shipment.id, driverId);
          break;
        default:
          Toast.show({
            icon: 'fail',
            content: '当前状态无需操作',
          });
          setActionLoading(false);
          return;
      }
      Toast.show({
        icon: 'success',
        content: '状态更新成功',
      });
      await loadShipment();
    } catch (error: any) {
      console.error('更新状态失败:', error);
      const errorMessage = error?.response?.data?.error?.message || '状态更新失败，请稍后再试';
      Toast.show({
        icon: 'fail',
        content: errorMessage,
      });
    } finally {
      setActionLoading(false);
    }
  };

  const formatAddress = (address?: { city?: string; province?: string; addressLine1?: string }) => {
    return formatAddressUtil(address as any);
  };

  const handleCall = (phone?: string) => {
    try {
      if (!phone) {
        Toast.show({
          icon: 'fail',
          content: '未提供联系电话',
        });
        return;
      }
      makePhoneCall(phone);
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.message || '拨打电话失败',
      });
    }
  };

  const handleNavigate = (address?: { latitude?: number; longitude?: number; addressLine1?: string; city?: string; province?: string }) => {
    try {
      if (!address) {
        Toast.show({
          icon: 'fail',
          content: '地址信息未提供',
        });
        return;
      }
      navigateToAddress(address as any);
    } catch (error: any) {
      Toast.show({
        icon: 'fail',
        content: error.message || '导航失败',
      });
    }
  };

  // 2025-11-30T21:25:00 处理BOL下载
  const handleDownloadBOL = async () => {
    if (!shipment) return;
    try {
      Toast.show({
        icon: 'loading',
        content: '正在生成BOL文档...',
        duration: 0,
      });
      
      // 等待隐藏容器中的BOL文档渲染完成
      setTimeout(() => {
        const bolElement = bolContainerRef.current?.querySelector('.bol-document');
        if (!bolElement) {
          Toast.clear();
          Toast.show({
            icon: 'fail',
            content: 'BOL文档加载失败',
          });
          return;
        }
        
        // 使用html2canvas生成PDF
        import('html2canvas').then((html2canvas) => {
          import('jspdf').then((jsPDF) => {
            html2canvas.default(bolElement as HTMLElement, {
              scale: 2,
              useCORS: true,
              allowTaint: true,
              backgroundColor: '#ffffff',
            }).then((canvas) => {
              const imgData = canvas.toDataURL('image/png');
              const pdf = new jsPDF.default('p', 'mm', 'a4');
              const imgWidth = 210;
              const pageHeight = 297;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              let heightLeft = imgHeight;
              let position = 0;
              
              pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
              heightLeft -= pageHeight;
              
              while (heightLeft >= 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
              }
              
              const fileName = `BOL-${shipment.shipmentNumber || shipment.shipmentNo || shipment.id}-${new Date().toISOString().split('T')[0]}.pdf`;
              pdf.save(fileName);
              
              Toast.clear();
              Toast.show({
                icon: 'success',
                content: 'BOL文档下载成功',
              });
            }).catch((error) => {
              console.error('PDF生成失败:', error);
              Toast.clear();
              Toast.show({
                icon: 'fail',
                content: 'PDF生成失败，请重试',
              });
            });
          });
        });
      }, 500);
    } catch (error: any) {
      console.error('下载BOL失败:', error);
      Toast.clear();
      Toast.show({
        icon: 'fail',
        content: error.message || '下载失败，请重试',
      });
    }
  };

  // 2025-11-30T21:25:00 预览BOL文档
  const handlePreviewBOL = () => {
    setBolModalVisible(true);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <NavBar onBack={() => navigate('/dashboard')}>运单详情</NavBar>
        <div style={{ padding: '16px' }}>
          <Skeleton animated />
          <Skeleton animated style={{ marginTop: 12 }} />
          <Skeleton animated style={{ marginTop: 12 }} />
        </div>
      </div>
    );
  }

  if (!shipment) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <NavBar onBack={() => navigate('/dashboard')}>运单详情</NavBar>
        <div style={{ padding: '40px 16px', textAlign: 'center' }}>
          <p>运单不存在</p>
          <Button color="primary" onClick={() => navigate('/dashboard')} style={{ marginTop: 16 }}>
            返回任务列表
          </Button>
        </div>
      </div>
    );
  }

  const status = shipment.status;
  const statusColor = statusColorMap[status] || 'default';
  const statusText = statusTextMap[status] || status;
  const actionLabel = actionLabelMap[status];
  const number = shipment.shipmentNumber || shipment.shipmentNo || shipment.id;

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', paddingBottom: 80 }}>
      <NavBar
        onBack={() => navigate('/dashboard')}
        style={{ background: '#1890ff', color: '#fff' }}
      >
        运单详情
      </NavBar>

      <div style={{ padding: '12px' }}>
        {/* 运单基本信息 */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
                运单号: {number}
              </div>
              <Tag color={statusColor as any}>{statusText}</Tag>
            </div>
          </div>
          {shipment.customerName && (
            <div style={{ fontSize: 14, color: '#888', marginTop: 8 }}>
              客户：{shipment.customerName}
            </div>
          )}
        </Card>

        {/* 提货信息 */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>提货信息</div>
          <Space direction="vertical" style={{ width: '100%', '--gap': '12px' }}>
            <div>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>
                <EnvironmentOutline style={{ marginRight: 4 }} />
                地址
              </div>
              <div style={{ fontSize: 15, color: '#333' }}>
                {formatAddress(shipment.pickupAddress)}
              </div>
            </div>
            {shipment.pickupAddress && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="small"
                  color="primary"
                  fill="outline"
                  onClick={() => handleNavigate(shipment.pickupAddress)}
                >
                  导航
                </Button>
                {shipment.pickupAddress && (shipment.pickupAddress as any).phone && (
                  <Button
                    size="small"
                    color="primary"
                    fill="outline"
                    onClick={() => handleCall((shipment.pickupAddress as any).phone)}
                  >
                    <PhoneFill style={{ marginRight: 4 }} />
                    电话
                  </Button>
                )}
              </div>
            )}
          </Space>
        </Card>

        {/* 送达信息 */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>送达信息</div>
          <Space direction="vertical" style={{ width: '100%', '--gap': '12px' }}>
            <div>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>
                <EnvironmentOutline style={{ marginRight: 4 }} />
                地址
              </div>
              <div style={{ fontSize: 15, color: '#333' }}>
                {formatAddress(shipment.deliveryAddress)}
              </div>
            </div>
            {shipment.deliveryAddress && (
              <div style={{ display: 'flex', gap: 8 }}>
                <Button
                  size="small"
                  color="primary"
                  fill="outline"
                  onClick={() => handleNavigate(shipment.deliveryAddress)}
                >
                  导航
                </Button>
                {shipment.deliveryAddress && (shipment.deliveryAddress as any).phone && (
                  <Button
                    size="small"
                    color="primary"
                    fill="outline"
                    onClick={() => handleCall((shipment.deliveryAddress as any).phone)}
                  >
                    <PhoneFill style={{ marginRight: 4 }} />
                    电话
                  </Button>
                )}
              </div>
            )}
          </Space>
        </Card>

        {/* 货物信息 - 2025-11-30T21:25:00 添加货物信息显示 */}
        <Card style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 'bold' }}>货物信息</div>
            <Space>
              <Button
                size="small"
                color="primary"
                fill="outline"
                onClick={handlePreviewBOL}
              >
                <FileOutline style={{ marginRight: 4 }} />
                预览
              </Button>
              <Button
                size="small"
                color="primary"
                onClick={handleDownloadBOL}
              >
                <FileOutline style={{ marginRight: 4 }} />
                下载PDF
              </Button>
            </Space>
          </div>
          {(() => {
            const cargoInfo = (shipment as any).cargoInfo || {};
            const cargoItems = cargoInfo.cargoItems || [];
            
            // 多行货物模式
            if (cargoItems && Array.isArray(cargoItems) && cargoItems.length > 0) {
              const totalWeight = cargoItems.reduce((sum: number, item: any) => sum + ((item.weight || 0) * (item.quantity || 1)), 0);
              const totalQuantity = cargoItems.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
              
              return (
                <Space direction="vertical" style={{ width: '100%', '--gap': '8px' }}>
                  <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>货物明细：</div>
                  {cargoItems.map((item: any, index: number) => (
                    <div key={index} style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 13, color: '#666' }}>件数：</span>
                        <span style={{ fontSize: 14, fontWeight: 'bold' }}>{item.quantity || 0} 件</span>
                      </div>
                      {(item.length || item.width || item.height) && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: '#666' }}>规格：</span>
                          <span style={{ fontSize: 14 }}>{item.length || 0}×{item.width || 0}×{item.height || 0} cm</span>
                        </div>
                      )}
                      {item.weight && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, color: '#666' }}>重量：</span>
                          <span style={{ fontSize: 14 }}>{item.weight || 0} kg</span>
                        </div>
                      )}
                      {item.description && (
                        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #ddd' }}>
                          <span style={{ fontSize: 13, color: '#666' }}>描述：</span>
                          <div style={{ fontSize: 14, marginTop: 4 }}>{item.description}</div>
                        </div>
                      )}
                    </div>
                  ))}
                  <Divider />
                  <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ fontSize: 14, color: '#666' }}>总件数：<span style={{ fontWeight: 'bold' }}>{totalQuantity} 件</span></div>
                    <div style={{ fontSize: 14, color: '#666' }}>总重量：<span style={{ fontWeight: 'bold' }}>{totalWeight.toFixed(2)} kg</span></div>
                    {cargoInfo.volume && (
                      <div style={{ fontSize: 14, color: '#666' }}>总体积：<span style={{ fontWeight: 'bold' }}>{cargoInfo.volume.toFixed(2)} m³</span></div>
                    )}
                  </div>
                </Space>
              );
            }
            
            // 单行货物模式或兼容旧数据
            const description = cargoInfo.description || shipment.description || '无';
            const weight = cargoInfo.weight || (shipment as any).weightKg || 0;
            const dimensions = cargoInfo.dimensions || {
              length: (shipment as any).lengthCm || 0,
              width: (shipment as any).widthCm || 0,
              height: (shipment as any).heightCm || 0,
            };
            
            return (
              <Space direction="vertical" style={{ width: '100%', '--gap': '8px' }}>
                {description && description !== '无' && (
                  <div>
                    <div style={{ fontSize: 14, color: '#888', marginBottom: 4 }}>货物描述：</div>
                    <div style={{ fontSize: 15, color: '#333' }}>{description}</div>
                  </div>
                )}
                {(weight > 0 || (dimensions.length > 0 && dimensions.width > 0 && dimensions.height > 0)) && (
                  <>
                    <Divider />
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                      {weight > 0 && (
                        <div style={{ fontSize: 14, color: '#666' }}>重量：<span style={{ fontWeight: 'bold' }}>{weight.toFixed(2)} kg</span></div>
                      )}
                      {dimensions.length > 0 && dimensions.width > 0 && dimensions.height > 0 && (
                        <div style={{ fontSize: 14, color: '#666' }}>
                          尺寸：<span style={{ fontWeight: 'bold' }}>{dimensions.length}×{dimensions.width}×{dimensions.height} cm</span>
                        </div>
                      )}
                      {cargoInfo.volume && (
                        <div style={{ fontSize: 14, color: '#666' }}>体积：<span style={{ fontWeight: 'bold' }}>{cargoInfo.volume.toFixed(2)} m³</span></div>
                      )}
                    </div>
                  </>
                )}
              </Space>
            );
          })()}
        </Card>

        {/* 地图视图 */}
        {/* 2025-11-30T21:15:00 修复：使用 shipment.pickupAddress 和 shipment.deliveryAddress 而不是未定义的 pickup 和 delivery 变量 */}
        {((shipment.pickupAddress as any)?.latitude && (shipment.pickupAddress as any)?.longitude) || 
         ((shipment.deliveryAddress as any)?.latitude && (shipment.deliveryAddress as any)?.longitude) ? (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>路线地图</div>
            <MapView
              pickup={shipment.pickupAddress as any}
              delivery={shipment.deliveryAddress as any}
              currentLocation={currentLocation || undefined}
              showRoute={true}
              height="250px"
              onNavigate={(location) => {
                navigateToAddress(location as any);
              }}
            />
          </Card>
        ) : null}

        {/* POD上传 - 仅送达后可上传（delivered/pod_pending_review/completed） */}
        {(status === ShipmentStatus.DELIVERED || status === 'delivered' || status === 'pod_pending_review' || status === 'completed') && (
          <Card style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>签收凭证</div>
            <PODUploader
              shipmentId={shipment.id}
              onUploadSuccess={() => {
                // 上传成功后刷新运单信息
                loadShipment();
              }}
              onUploadError={(error) => {
                console.error('POD上传失败:', error);
              }}
              maxCount={5}
            />
          </Card>
        )}

        {/* 操作按钮 */}
        {actionLabel && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '12px', background: '#fff', borderTop: '1px solid #eee' }}>
            <Button
              block
              color="primary"
              size="large"
              loading={actionLoading}
              onClick={handleAdvanceStatus}
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </div>

      {/* 隐藏的BOL容器用于PDF生成 - 2025-11-30T21:25:00 */}
      <div
        ref={bolContainerRef}
        style={{
          position: 'fixed',
          left: '-10000px',
          top: '0',
          width: '21cm',
          visibility: 'hidden',
        }}
      >
        {shipment && <BOLDocument shipment={shipment} showPrintButton={false} />}
      </div>

      {/* BOL预览模态框 - 2025-11-30T21:25:00 */}
      <Modal
        visible={bolModalVisible}
        content={
          <div style={{ maxHeight: '80vh', overflow: 'auto', padding: '12px' }}>
            {shipment && (
              <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left', width: '200%' }}>
                <BOLDocument shipment={shipment} showPrintButton={false} />
              </div>
            )}
          </div>
        }
        closeOnAction
        onClose={() => setBolModalVisible(false)}
        actions={[
          {
            key: 'close',
            text: '关闭',
          },
        ]}
        title="BOL 文档预览"
      />
    </div>
  );
}

