// 2025-11-30T11:30:00Z Created by Assistant: POD上传组件
import { useState, useRef } from 'react';
import { ImageUploader, Button, Toast, ProgressBar, Image } from 'antd-mobile';
import { CameraOutline, DeleteOutline } from 'antd-mobile-icons'; // 2025-11-30T12:50:00Z Fixed by Assistant: 修复图标名称
import { compressImage, previewImage, ImageCompressOptions } from '../../utils/imageCompress';

export interface UploadedFile {
  url: string;
  file: File;
}

interface PODUploaderProps {
  shipmentId: string;
  onUploadSuccess?: (file: File) => void;
  onUploadError?: (error: Error) => void;
  maxCount?: number; // 最大上传数量，默认1
  compressOptions?: ImageCompressOptions;
}

export default function PODUploader({
  shipmentId,
  onUploadSuccess,
  onUploadError,
  maxCount = 1,
  compressOptions = { maxWidth: 1920, quality: 0.8 },
}: PODUploaderProps) {
  const [fileList, setFileList] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [compressing, setCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 处理文件选择
  const handleFileSelect = async (file: File) => {
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      Toast.show({
        icon: 'fail',
        content: '请选择图片文件',
      });
      return;
    }

    // 检查文件大小（10MB限制）
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      Toast.show({
        icon: 'fail',
        content: '图片大小不能超过10MB',
      });
      return;
    }

    try {
      setCompressing(true);
      Toast.show({
        icon: 'loading',
        content: '正在压缩图片...',
        duration: 0,
      });

      // 压缩图片
      const compressedFile = await compressImage(file, compressOptions);
      
      Toast.clear();
      
      // 生成预览
      const previewUrl = await previewImage(compressedFile);
      
      // 添加到文件列表
      const newFile: UploadedFile = {
        url: previewUrl,
        file: compressedFile,
      };

      if (maxCount === 1) {
        setFileList([newFile]);
      } else {
        setFileList((prev) => [...prev, newFile]);
      }

      // 自动上传
      await handleUpload(newFile);
    } catch (error: any) {
      console.error('文件处理失败:', error);
      Toast.show({
        icon: 'fail',
        content: error.message || '文件处理失败',
      });
      onUploadError?.(error);
    } finally {
      setCompressing(false);
      Toast.clear();
    }
  };

  // 上传文件
  const handleUpload = async (uploadFile: UploadedFile) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      // 模拟上传进度
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // 这里应该调用实际的上传API
      // 为了演示，我们先导入API
      const { driverShipmentsApi } = await import('../../services/api');
      await driverShipmentsApi.uploadShipmentPOD(shipmentId, uploadFile.file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      Toast.show({
        icon: 'success',
        content: '上传成功',
        duration: 2000,
      });

      onUploadSuccess?.(uploadFile.file);
    } catch (error: any) {
      console.error('上传失败:', error);
      const errorMessage = error?.response?.data?.error?.message || '上传失败，请稍后重试';
      Toast.show({
        icon: 'fail',
        content: errorMessage,
      });
      onUploadError?.(error);
      
      // 上传失败，从列表中移除
      setFileList((prev) => prev.filter((f) => f.url !== uploadFile.url));
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  // 删除文件
  const handleDelete = (file: UploadedFile) => {
    setFileList((prev) => prev.filter((f) => f.url !== file.url));
  };

  // 触发文件选择
  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div>
      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment" // 使用后置摄像头
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            handleFileSelect(file);
          }
          // 重置input，允许重复选择同一文件
          e.target.value = '';
        }}
      />

      {/* 文件列表 */}
      {fileList.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          {fileList.map((file, index) => (
            <div
              key={index}
              style={{
                position: 'relative',
                marginBottom: 8,
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid #ddd',
              }}
            >
              <Image
                src={file.url}
                alt={`预览 ${index + 1}`}
                style={{ width: '100%', height: 'auto' }}
                fit="cover"
              />
              {!uploading && (
                <div
                  onClick={() => handleDelete(file)}
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 32,
                    height: 32,
                    borderRadius: 16,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <DeleteOutline style={{ fontSize: 18, color: '#fff' }} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 上传进度 */}
      {uploading && uploadProgress > 0 && (
        <div style={{ marginBottom: 12 }}>
          <ProgressBar percent={uploadProgress} />
          <div style={{ fontSize: 12, color: '#888', marginTop: 4, textAlign: 'center' }}>
            上传中 {uploadProgress}%
          </div>
        </div>
      )}

      {/* 上传按钮 */}
      {fileList.length < maxCount && !compressing && !uploading && (
        <Button
          color="primary"
          fill="outline"
          block
          onClick={triggerFileSelect}
          style={{ marginTop: 8 }}
        >
          <CameraOutline style={{ marginRight: 4 }} />
          {fileList.length === 0 ? '拍照上传' : '继续上传'}
        </Button>
      )}

      {compressing && (
        <div style={{ textAlign: 'center', padding: '16px 0', color: '#888' }}>
          正在压缩图片...
        </div>
      )}
    </div>
  );
}

