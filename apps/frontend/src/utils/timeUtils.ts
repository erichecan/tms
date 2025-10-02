// 时间格式化工具函数 - 2025-10-02 16:38:00
// 统一整个系统的时间格式，移除秒数显示

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('zh-CN', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    console.error('Error formatting date:', error, 'date:', date);
    return '-';
  }
};

export const formatDateTimeShort = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString('zh-CN', { 
      month: 'numeric', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  } catch (error) {
    console.error('Error formatting short date:', error, 'date:', date);
    return '-';
  }
};

export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '-';
  
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('zh-CN');
  } catch (error) {
    console.error('Error formatting date only:', error, 'date:', date);
    return '-';
  }
};
