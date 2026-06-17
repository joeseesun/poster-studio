/**
 * 图标库配置
 * 精选250个最常用的Lucide图标，按10个分类组织
 * 覆盖设计中最常见的使用场景，包括：
 * - 箭头类 (51个)：各种方向和样式的箭头、旋转、撤销重做等
 * - 形状类 (42个)：基础几何形状、自然元素、装饰图案等
 * - UI类 (30个)：界面常用图标，如菜单、搜索、设置、提示等
 * - 社交类 (20个)：消息、分享、点赞、用户管理等社交功能图标
 * - 文件类 (20个)：文件、文件夹、上传下载、链接等文件操作
 * - 编辑类 (20个)：文本编辑、格式化、对齐、绘画工具等编辑功能
 * - 媒体类 (20个)：图片、视频、音乐、播放控制、设备等
 * - 商业类 (15个)：购物、支付、图表、包裹等商业场景
 * - 天气类 (8个)：天气状态、自然现象等
 * - 其他类 (26个)：日历、时钟、地图、网络、电源等通用图标
 */

import * as LucideIcons from 'lucide-react';

export type IconCategory =
  | '箭头'
  | '形状'
  | 'UI'
  | '社交'
  | '文件'
  | '编辑'
  | '媒体'
  | '商业'
  | '天气'
  | '其他';

export interface IconConfig {
  name: string;
  category: IconCategory;
  component: any; // Lucide React 组件
  keywords: string[]; // 搜索关键词
}

// 图标配置列表（250个精选图标）
export const ICON_LIBRARY: IconConfig[] = [
  // 箭头类 (51个)
  { name: 'ArrowUp', category: '箭头', component: LucideIcons.ArrowUp, keywords: ['arrow', 'up', '上', '箭头'] },
  { name: 'ArrowDown', category: '箭头', component: LucideIcons.ArrowDown, keywords: ['arrow', 'down', '下', '箭头'] },
  { name: 'ArrowLeft', category: '箭头', component: LucideIcons.ArrowLeft, keywords: ['arrow', 'left', '左', '箭头'] },
  { name: 'ArrowRight', category: '箭头', component: LucideIcons.ArrowRight, keywords: ['arrow', 'right', '右', '箭头'] },
  { name: 'ArrowUpRight', category: '箭头', component: LucideIcons.ArrowUpRight, keywords: ['arrow', 'up', 'right', '右上', '箭头'] },
  { name: 'ArrowDownRight', category: '箭头', component: LucideIcons.ArrowDownRight, keywords: ['arrow', 'down', 'right', '右下', '箭头'] },
  { name: 'ArrowUpLeft', category: '箭头', component: LucideIcons.ArrowUpLeft, keywords: ['arrow', 'up', 'left', '左上', '箭头'] },
  { name: 'ArrowDownLeft', category: '箭头', component: LucideIcons.ArrowDownLeft, keywords: ['arrow', 'down', 'left', '左下', '箭头'] },
  { name: 'ChevronUp', category: '箭头', component: LucideIcons.ChevronUp, keywords: ['chevron', 'up', '上', '尖括号'] },
  { name: 'ChevronDown', category: '箭头', component: LucideIcons.ChevronDown, keywords: ['chevron', 'down', '下', '尖括号'] },
  { name: 'ChevronLeft', category: '箭头', component: LucideIcons.ChevronLeft, keywords: ['chevron', 'left', '左', '尖括号'] },
  { name: 'ChevronRight', category: '箭头', component: LucideIcons.ChevronRight, keywords: ['chevron', 'right', '右', '尖括号'] },
  { name: 'ChevronsUp', category: '箭头', component: LucideIcons.ChevronsUp, keywords: ['chevrons', 'up', '双上', '尖括号'] },
  { name: 'ChevronsDown', category: '箭头', component: LucideIcons.ChevronsDown, keywords: ['chevrons', 'down', '双下', '尖括号'] },
  { name: 'ChevronsLeft', category: '箭头', component: LucideIcons.ChevronsLeft, keywords: ['chevrons', 'left', '双左', '尖括号'] },
  { name: 'ChevronsRight', category: '箭头', component: LucideIcons.ChevronsRight, keywords: ['chevrons', 'right', '双右', '尖括号'] },
  { name: 'ChevronsUpDown', category: '箭头', component: LucideIcons.ChevronsUpDown, keywords: ['chevrons', 'up', 'down', '上下', '尖括号'] },
  { name: 'ChevronsLeftRight', category: '箭头', component: LucideIcons.ChevronsLeftRight, keywords: ['chevrons', 'left', 'right', '左右', '尖括号'] },
  { name: 'ArrowBigUp', category: '箭头', component: LucideIcons.ArrowBigUp, keywords: ['arrow', 'big', 'up', '大箭头', '上'] },
  { name: 'ArrowBigDown', category: '箭头', component: LucideIcons.ArrowBigDown, keywords: ['arrow', 'big', 'down', '大箭头', '下'] },
  { name: 'ArrowBigLeft', category: '箭头', component: LucideIcons.ArrowBigLeft, keywords: ['arrow', 'big', 'left', '大箭头', '左'] },
  { name: 'ArrowBigRight', category: '箭头', component: LucideIcons.ArrowBigRight, keywords: ['arrow', 'big', 'right', '大箭头', '右'] },
  { name: 'ArrowUpCircle', category: '箭头', component: LucideIcons.ArrowUpCircle, keywords: ['arrow', 'up', 'circle', '圆圈箭头', '上'] },
  { name: 'ArrowDownCircle', category: '箭头', component: LucideIcons.ArrowDownCircle, keywords: ['arrow', 'down', 'circle', '圆圈箭头', '下'] },
  { name: 'ArrowLeftCircle', category: '箭头', component: LucideIcons.ArrowLeftCircle, keywords: ['arrow', 'left', 'circle', '圆圈箭头', '左'] },
  { name: 'ArrowRightCircle', category: '箭头', component: LucideIcons.ArrowRightCircle, keywords: ['arrow', 'right', 'circle', '圆圈箭头', '右'] },
  { name: 'MoveUp', category: '箭头', component: LucideIcons.MoveUp, keywords: ['move', 'up', '移动', '上'] },
  { name: 'MoveDown', category: '箭头', component: LucideIcons.MoveDown, keywords: ['move', 'down', '移动', '下'] },
  { name: 'MoveLeft', category: '箭头', component: LucideIcons.MoveLeft, keywords: ['move', 'left', '移动', '左'] },
  { name: 'MoveRight', category: '箭头', component: LucideIcons.MoveRight, keywords: ['move', 'right', '移动', '右'] },
  { name: 'MoveUpRight', category: '箭头', component: LucideIcons.MoveUpRight, keywords: ['move', 'up', 'right', '移动', '右上'] },
  { name: 'MoveDownRight', category: '箭头', component: LucideIcons.MoveDownRight, keywords: ['move', 'down', 'right', '移动', '右下'] },
  { name: 'MoveUpLeft', category: '箭头', component: LucideIcons.MoveUpLeft, keywords: ['move', 'up', 'left', '移动', '左上'] },
  { name: 'MoveDownLeft', category: '箭头', component: LucideIcons.MoveDownLeft, keywords: ['move', 'down', 'left', '移动', '左下'] },
  { name: 'CornerUpLeft', category: '箭头', component: LucideIcons.CornerUpLeft, keywords: ['corner', 'up', 'left', '转角', '左上'] },
  { name: 'CornerUpRight', category: '箭头', component: LucideIcons.CornerUpRight, keywords: ['corner', 'up', 'right', '转角', '右上'] },
  { name: 'CornerDownLeft', category: '箭头', component: LucideIcons.CornerDownLeft, keywords: ['corner', 'down', 'left', '转角', '左下'] },
  { name: 'CornerDownRight', category: '箭头', component: LucideIcons.CornerDownRight, keywords: ['corner', 'down', 'right', '转角', '右下'] },
  { name: 'CornerLeftUp', category: '箭头', component: LucideIcons.CornerLeftUp, keywords: ['corner', 'left', 'up', '转角', '上左'] },
  { name: 'CornerLeftDown', category: '箭头', component: LucideIcons.CornerLeftDown, keywords: ['corner', 'left', 'down', '转角', '下左'] },
  { name: 'CornerRightUp', category: '箭头', component: LucideIcons.CornerRightUp, keywords: ['corner', 'right', 'up', '转角', '上右'] },
  { name: 'CornerRightDown', category: '箭头', component: LucideIcons.CornerRightDown, keywords: ['corner', 'right', 'down', '转角', '下右'] },
  { name: 'Undo', category: '箭头', component: LucideIcons.Undo, keywords: ['undo', '撤销', '返回'] },
  { name: 'Redo', category: '箭头', component: LucideIcons.Redo, keywords: ['redo', '重做', '前进'] },
  { name: 'RotateCw', category: '箭头', component: LucideIcons.RotateCw, keywords: ['rotate', 'clockwise', '旋转', '顺时针'] },
  { name: 'RotateCcw', category: '箭头', component: LucideIcons.RotateCcw, keywords: ['rotate', 'counterclockwise', '旋转', '逆时针'] },
  { name: 'RefreshCw', category: '箭头', component: LucideIcons.RefreshCw, keywords: ['refresh', 'reload', '刷新', '重载'] },
  { name: 'RefreshCcw', category: '箭头', component: LucideIcons.RefreshCcw, keywords: ['refresh', 'reload', '刷新', '重载'] },
  { name: 'Repeat', category: '箭头', component: LucideIcons.Repeat, keywords: ['repeat', 'loop', '重复', '循环'] },
  { name: 'Shuffle', category: '箭头', component: LucideIcons.Shuffle, keywords: ['shuffle', 'random', '随机', '打乱'] },

  // 形状类 (42个)
  { name: 'Circle', category: '形状', component: LucideIcons.Circle, keywords: ['circle', '圆', '圆形'] },
  { name: 'Square', category: '形状', component: LucideIcons.Square, keywords: ['square', '方', '方形'] },
  { name: 'Triangle', category: '形状', component: LucideIcons.Triangle, keywords: ['triangle', '三角', '三角形'] },
  { name: 'Star', category: '形状', component: LucideIcons.Star, keywords: ['star', '星', '星星'] },
  { name: 'Hexagon', category: '形状', component: LucideIcons.Hexagon, keywords: ['hexagon', '六边形'] },
  { name: 'Pentagon', category: '形状', component: LucideIcons.Pentagon, keywords: ['pentagon', '五边形'] },
  { name: 'Octagon', category: '形状', component: LucideIcons.Octagon, keywords: ['octagon', '八边形'] },
  { name: 'Diamond', category: '形状', component: LucideIcons.Diamond, keywords: ['diamond', '钻石', '菱形'] },
  { name: 'Sparkles', category: '形状', component: LucideIcons.Sparkles, keywords: ['sparkles', '闪光', '星星'] },
  { name: 'CircleDot', category: '形状', component: LucideIcons.CircleDot, keywords: ['circle', 'dot', '圆点'] },
  { name: 'Disc', category: '形状', component: LucideIcons.Disc, keywords: ['disc', '圆盘', '光盘'] },
  { name: 'Shapes', category: '形状', component: LucideIcons.Shapes, keywords: ['shapes', '形状', '几何'] },
  { name: 'Box', category: '形状', component: LucideIcons.Box, keywords: ['box', '盒子', '立方体'] },
  { name: 'Package', category: '形状', component: LucideIcons.Package, keywords: ['package', 'box', '包裹', '盒子'] },
  { name: 'Gem', category: '形状', component: LucideIcons.Gem, keywords: ['gem', '宝石', '钻石'] },
  { name: 'Crown', category: '形状', component: LucideIcons.Crown, keywords: ['crown', '皇冠', '王冠'] },
  { name: 'Award', category: '形状', component: LucideIcons.Award, keywords: ['award', '奖章', '勋章'] },
  { name: 'Medal', category: '形状', component: LucideIcons.Medal, keywords: ['medal', '奖牌', '勋章'] },
  { name: 'Shield', category: '形状', component: LucideIcons.Shield, keywords: ['shield', '盾牌', '保护'] },
  { name: 'ShieldCheck', category: '形状', component: LucideIcons.ShieldCheck, keywords: ['shield', 'check', '盾牌', '验证'] },
  { name: 'ShieldAlert', category: '形状', component: LucideIcons.ShieldAlert, keywords: ['shield', 'alert', '盾牌', '警告'] },
  { name: 'ShieldQuestion', category: '形状', component: LucideIcons.ShieldQuestion, keywords: ['shield', 'question', '盾牌', '问题'] },
  { name: 'Flame', category: '形状', component: LucideIcons.Flame, keywords: ['flame', 'fire', '火焰', '火'] },
  { name: 'Droplet', category: '形状', component: LucideIcons.Droplet, keywords: ['droplet', 'water', '水滴', '水'] },
  { name: 'Droplets', category: '形状', component: LucideIcons.Droplets, keywords: ['droplets', 'water', '水滴', '水'] },
  { name: 'Waves', category: '形状', component: LucideIcons.Waves, keywords: ['waves', '波浪', '水波'] },
  { name: 'Wind', category: '形状', component: LucideIcons.Wind, keywords: ['wind', '风', '气流'] },
  { name: 'Snowflake', category: '形状', component: LucideIcons.Snowflake, keywords: ['snowflake', '雪花', '雪'] },
  { name: 'Sparkle', category: '形状', component: LucideIcons.Sparkle, keywords: ['sparkle', '闪光', '星光'] },
  { name: 'Zap', category: '形状', component: LucideIcons.Zap, keywords: ['zap', 'lightning', '闪电', '电'] },
  { name: 'Feather', category: '形状', component: LucideIcons.Feather, keywords: ['feather', '羽毛', '轻'] },
  { name: 'Leaf', category: '形状', component: LucideIcons.Leaf, keywords: ['leaf', '叶子', '植物'] },
  { name: 'Flower', category: '形状', component: LucideIcons.Flower, keywords: ['flower', '花', '植物'] },
  { name: 'Trees', category: '形状', component: LucideIcons.Trees, keywords: ['trees', '树', '森林'] },
  { name: 'Sprout', category: '形状', component: LucideIcons.Sprout, keywords: ['sprout', '发芽', '植物'] },
  { name: 'Footprints', category: '形状', component: LucideIcons.Footprints, keywords: ['footprints', '脚印', '足迹'] },
  { name: 'Fingerprint', category: '形状', component: LucideIcons.Fingerprint, keywords: ['fingerprint', '指纹', '识别'] },
  { name: 'Infinity', category: '形状', component: LucideIcons.Infinity, keywords: ['infinity', '无限', '符号'] },
  { name: 'Umbrella', category: '形状', component: LucideIcons.Umbrella, keywords: ['umbrella', '雨伞', '伞'] },
  { name: 'Key', category: '形状', component: LucideIcons.Key, keywords: ['key', '钥匙', '密钥'] },

  // UI类 (30个)
  { name: 'Check', category: 'UI', component: LucideIcons.Check, keywords: ['check', '对', '勾', '确认'] },
  { name: 'X', category: 'UI', component: LucideIcons.X, keywords: ['x', '错', '叉', '关闭'] },
  { name: 'Plus', category: 'UI', component: LucideIcons.Plus, keywords: ['plus', '加', '添加'] },
  { name: 'Minus', category: 'UI', component: LucideIcons.Minus, keywords: ['minus', '减', '删除'] },
  { name: 'Menu', category: 'UI', component: LucideIcons.Menu, keywords: ['menu', '菜单', '汉堡'] },
  { name: 'MoreVertical', category: 'UI', component: LucideIcons.MoreVertical, keywords: ['more', 'vertical', '更多', '竖'] },
  { name: 'MoreHorizontal', category: 'UI', component: LucideIcons.MoreHorizontal, keywords: ['more', 'horizontal', '更多', '横'] },
  { name: 'Search', category: 'UI', component: LucideIcons.Search, keywords: ['search', '搜索', '查找'] },
  { name: 'Settings', category: 'UI', component: LucideIcons.Settings, keywords: ['settings', '设置', '齿轮'] },
  { name: 'Home', category: 'UI', component: LucideIcons.Home, keywords: ['home', '首页', '主页'] },
  { name: 'User', category: 'UI', component: LucideIcons.User, keywords: ['user', '用户', '人'] },
  { name: 'Bell', category: 'UI', component: LucideIcons.Bell, keywords: ['bell', '铃铛', '通知'] },
  { name: 'Mail', category: 'UI', component: LucideIcons.Mail, keywords: ['mail', '邮件', '信'] },
  { name: 'Lock', category: 'UI', component: LucideIcons.Lock, keywords: ['lock', '锁', '安全'] },
  { name: 'Unlock', category: 'UI', component: LucideIcons.Unlock, keywords: ['unlock', '解锁', '开锁'] },
  { name: 'Filter', category: 'UI', component: LucideIcons.Filter, keywords: ['filter', '过滤', '筛选'] },
  { name: 'SlidersHorizontal', category: 'UI', component: LucideIcons.SlidersHorizontal, keywords: ['sliders', 'adjust', '调节', '滑块'] },
  { name: 'Grid', category: 'UI', component: LucideIcons.Grid, keywords: ['grid', '网格', '布局'] },
  { name: 'List', category: 'UI', component: LucideIcons.List, keywords: ['list', '列表'] },
  { name: 'Layers', category: 'UI', component: LucideIcons.Layers, keywords: ['layers', '图层', '层级'] },
  { name: 'Layout', category: 'UI', component: LucideIcons.Layout, keywords: ['layout', '布局'] },
  { name: 'Maximize', category: 'UI', component: LucideIcons.Maximize, keywords: ['maximize', '最大化', '全屏'] },
  { name: 'Minimize', category: 'UI', component: LucideIcons.Minimize, keywords: ['minimize', '最小化'] },
  { name: 'ZoomIn', category: 'UI', component: LucideIcons.ZoomIn, keywords: ['zoom', 'in', '放大'] },
  { name: 'ZoomOut', category: 'UI', component: LucideIcons.ZoomOut, keywords: ['zoom', 'out', '缩小'] },
  { name: 'Info', category: 'UI', component: LucideIcons.Info, keywords: ['info', 'information', '信息', '提示'] },
  { name: 'AlertCircle', category: 'UI', component: LucideIcons.AlertCircle, keywords: ['alert', 'warning', '警告', '提醒'] },
  { name: 'AlertTriangle', category: 'UI', component: LucideIcons.AlertTriangle, keywords: ['alert', 'warning', '警告', '危险'] },
  { name: 'HelpCircle', category: 'UI', component: LucideIcons.HelpCircle, keywords: ['help', 'question', '帮助', '问题'] },
  { name: 'XCircle', category: 'UI', component: LucideIcons.XCircle, keywords: ['x', 'close', 'error', '错误', '关闭'] },

  // 社交类 (20个)
  { name: 'MessageCircle', category: '社交', component: LucideIcons.MessageCircle, keywords: ['message', 'chat', '消息', '聊天'] },
  { name: 'MessageSquare', category: '社交', component: LucideIcons.MessageSquare, keywords: ['message', 'chat', '消息', '聊天'] },
  { name: 'Send', category: '社交', component: LucideIcons.Send, keywords: ['send', '发送', '飞机'] },
  { name: 'Share2', category: '社交', component: LucideIcons.Share2, keywords: ['share', '分享', '转发'] },
  { name: 'ThumbsUp', category: '社交', component: LucideIcons.ThumbsUp, keywords: ['thumbs', 'up', 'like', '点赞', '赞'] },
  { name: 'ThumbsDown', category: '社交', component: LucideIcons.ThumbsDown, keywords: ['thumbs', 'down', 'dislike', '踩'] },
  { name: 'Smile', category: '社交', component: LucideIcons.Smile, keywords: ['smile', 'emoji', '笑脸', '表情'] },
  { name: 'Frown', category: '社交', component: LucideIcons.Frown, keywords: ['frown', 'sad', '难过', '表情'] },
  { name: 'Meh', category: '社交', component: LucideIcons.Meh, keywords: ['meh', 'neutral', '无语', '表情'] },
  { name: 'Users', category: '社交', component: LucideIcons.Users, keywords: ['users', 'people', '用户', '人群'] },
  { name: 'UserPlus', category: '社交', component: LucideIcons.UserPlus, keywords: ['user', 'add', '添加用户', '关注'] },
  { name: 'UserMinus', category: '社交', component: LucideIcons.UserMinus, keywords: ['user', 'remove', '删除用户', '取关'] },
  { name: 'UserCheck', category: '社交', component: LucideIcons.UserCheck, keywords: ['user', 'verified', '认证', '验证'] },
  { name: 'AtSign', category: '社交', component: LucideIcons.AtSign, keywords: ['at', 'mention', '@', '提及'] },
  { name: 'Hash', category: '社交', component: LucideIcons.Hash, keywords: ['hash', 'hashtag', '#', '话题'] },
  { name: 'Phone', category: '社交', component: LucideIcons.Phone, keywords: ['phone', 'call', '电话', '通话'] },
  { name: 'PhoneCall', category: '社交', component: LucideIcons.PhoneCall, keywords: ['phone', 'call', '来电', '通话'] },
  { name: 'PhoneOff', category: '社交', component: LucideIcons.PhoneOff, keywords: ['phone', 'off', '挂断', '关闭'] },
  { name: 'Laugh', category: '社交', component: LucideIcons.Laugh, keywords: ['laugh', 'happy', '大笑', '开心'] },
  { name: 'Heart', category: '社交', component: LucideIcons.Heart, keywords: ['heart', 'love', 'like', '爱心', '喜欢'] },

  // 文件类 (20个)
  { name: 'File', category: '文件', component: LucideIcons.File, keywords: ['file', '文件'] },
  { name: 'FileText', category: '文件', component: LucideIcons.FileText, keywords: ['file', 'text', '文本', '文档'] },
  { name: 'Folder', category: '文件', component: LucideIcons.Folder, keywords: ['folder', '文件夹', '目录'] },
  { name: 'FolderOpen', category: '文件', component: LucideIcons.FolderOpen, keywords: ['folder', 'open', '打开', '文件夹'] },
  { name: 'Download', category: '文件', component: LucideIcons.Download, keywords: ['download', '下载'] },
  { name: 'Upload', category: '文件', component: LucideIcons.Upload, keywords: ['upload', '上传'] },
  { name: 'Save', category: '文件', component: LucideIcons.Save, keywords: ['save', '保存'] },
  { name: 'Trash2', category: '文件', component: LucideIcons.Trash2, keywords: ['trash', 'delete', '删除', '垃圾桶'] },
  { name: 'Copy', category: '文件', component: LucideIcons.Copy, keywords: ['copy', '复制'] },
  { name: 'Clipboard', category: '文件', component: LucideIcons.Clipboard, keywords: ['clipboard', '剪贴板'] },
  { name: 'FilePlus', category: '文件', component: LucideIcons.FilePlus, keywords: ['file', 'add', '新建文件'] },
  { name: 'FileMinus', category: '文件', component: LucideIcons.FileMinus, keywords: ['file', 'remove', '删除文件'] },
  { name: 'FileCheck', category: '文件', component: LucideIcons.FileCheck, keywords: ['file', 'check', '文件验证'] },
  { name: 'FileX', category: '文件', component: LucideIcons.FileX, keywords: ['file', 'error', '文件错误'] },
  { name: 'FolderPlus', category: '文件', component: LucideIcons.FolderPlus, keywords: ['folder', 'add', '新建文件夹'] },
  { name: 'Files', category: '文件', component: LucideIcons.Files, keywords: ['files', 'multiple', '多个文件'] },
  { name: 'Paperclip', category: '文件', component: LucideIcons.Paperclip, keywords: ['paperclip', 'attach', '附件', '回形针'] },
  { name: 'Link', category: '文件', component: LucideIcons.Link, keywords: ['link', 'url', '链接'] },
  { name: 'ExternalLink', category: '文件', component: LucideIcons.ExternalLink, keywords: ['external', 'link', '外部链接'] },
  { name: 'Archive', category: '文件', component: LucideIcons.Archive, keywords: ['archive', 'zip', '归档', '压缩'] },

  // 编辑类 (20个)
  { name: 'Pencil', category: '编辑', component: LucideIcons.Pencil, keywords: ['pencil', 'edit', '铅笔', '编辑'] },
  { name: 'PencilLine', category: '编辑', component: LucideIcons.PencilLine, keywords: ['pencil', 'edit', '铅笔', '编辑'] },
  { name: 'Pen', category: '编辑', component: LucideIcons.Pen, keywords: ['pen', 'edit', '笔', '编辑'] },
  { name: 'Type', category: '编辑', component: LucideIcons.Type, keywords: ['type', 'text', '文字', '字体'] },
  { name: 'Bold', category: '编辑', component: LucideIcons.Bold, keywords: ['bold', '粗体'] },
  { name: 'Italic', category: '编辑', component: LucideIcons.Italic, keywords: ['italic', '斜体'] },
  { name: 'Underline', category: '编辑', component: LucideIcons.Underline, keywords: ['underline', '下划线'] },
  { name: 'AlignLeft', category: '编辑', component: LucideIcons.AlignLeft, keywords: ['align', 'left', '左对齐'] },
  { name: 'AlignCenter', category: '编辑', component: LucideIcons.AlignCenter, keywords: ['align', 'center', '居中'] },
  { name: 'AlignRight', category: '编辑', component: LucideIcons.AlignRight, keywords: ['align', 'right', '右对齐'] },
  { name: 'AlignJustify', category: '编辑', component: LucideIcons.AlignJustify, keywords: ['align', 'justify', '两端对齐'] },
  { name: 'Strikethrough', category: '编辑', component: LucideIcons.Strikethrough, keywords: ['strikethrough', '删除线'] },
  { name: 'Highlighter', category: '编辑', component: LucideIcons.Highlighter, keywords: ['highlighter', 'marker', '高亮', '标记'] },
  { name: 'Eraser', category: '编辑', component: LucideIcons.Eraser, keywords: ['eraser', 'delete', '橡皮擦', '擦除'] },
  { name: 'Scissors', category: '编辑', component: LucideIcons.Scissors, keywords: ['scissors', 'cut', '剪刀', '剪切'] },
  { name: 'Palette', category: '编辑', component: LucideIcons.Palette, keywords: ['palette', 'color', '调色板', '颜色'] },
  { name: 'Pipette', category: '编辑', component: LucideIcons.Pipette, keywords: ['pipette', 'eyedropper', '吸管', '取色'] },
  { name: 'Brush', category: '编辑', component: LucideIcons.Brush, keywords: ['brush', 'paint', '画笔', '绘画'] },
  { name: 'Wand2', category: '编辑', component: LucideIcons.Wand2, keywords: ['wand', 'magic', '魔法棒', '魔术'] },
  { name: 'Crop', category: '编辑', component: LucideIcons.Crop, keywords: ['crop', 'cut', '裁剪', '剪裁'] },

  // 媒体类 (20个)
  { name: 'Image', category: '媒体', component: LucideIcons.Image, keywords: ['image', 'photo', '图片', '照片'] },
  { name: 'Camera', category: '媒体', component: LucideIcons.Camera, keywords: ['camera', '相机', '拍照'] },
  { name: 'Video', category: '媒体', component: LucideIcons.Video, keywords: ['video', '视频'] },
  { name: 'Music', category: '媒体', component: LucideIcons.Music, keywords: ['music', '音乐'] },
  { name: 'Play', category: '媒体', component: LucideIcons.Play, keywords: ['play', '播放'] },
  { name: 'Pause', category: '媒体', component: LucideIcons.Pause, keywords: ['pause', '暂停'] },
  { name: 'Volume', category: '媒体', component: LucideIcons.Volume, keywords: ['volume', 'sound', '音量', '声音'] },
  { name: 'VolumeX', category: '媒体', component: LucideIcons.VolumeX, keywords: ['volume', 'mute', '静音'] },
  { name: 'Mic', category: '媒体', component: LucideIcons.Mic, keywords: ['mic', 'microphone', '麦克风'] },
  { name: 'MicOff', category: '媒体', component: LucideIcons.MicOff, keywords: ['mic', 'off', '关闭麦克风'] },
  { name: 'Film', category: '媒体', component: LucideIcons.Film, keywords: ['film', 'movie', '电影', '胶片'] },
  { name: 'SkipForward', category: '媒体', component: LucideIcons.SkipForward, keywords: ['skip', 'forward', '快进', '下一个'] },
  { name: 'SkipBack', category: '媒体', component: LucideIcons.SkipBack, keywords: ['skip', 'back', '快退', '上一个'] },
  { name: 'Headphones', category: '媒体', component: LucideIcons.Headphones, keywords: ['headphones', '耳机', '音频'] },
  { name: 'Radio', category: '媒体', component: LucideIcons.Radio, keywords: ['radio', '收音机', '广播'] },
  { name: 'Tv', category: '媒体', component: LucideIcons.Tv, keywords: ['tv', 'television', '电视'] },
  { name: 'Monitor', category: '媒体', component: LucideIcons.Monitor, keywords: ['monitor', 'screen', '显示器', '屏幕'] },
  { name: 'Smartphone', category: '媒体', component: LucideIcons.Smartphone, keywords: ['smartphone', 'mobile', '手机'] },
  { name: 'Tablet', category: '媒体', component: LucideIcons.Tablet, keywords: ['tablet', 'ipad', '平板'] },
  { name: 'Laptop', category: '媒体', component: LucideIcons.Laptop, keywords: ['laptop', 'computer', '笔记本', '电脑'] },

  // 商业类 (15个)
  { name: 'ShoppingCart', category: '商业', component: LucideIcons.ShoppingCart, keywords: ['cart', 'shopping', '购物车'] },
  { name: 'ShoppingBag', category: '商业', component: LucideIcons.ShoppingBag, keywords: ['bag', 'shopping', '购物袋'] },
  { name: 'CreditCard', category: '商业', component: LucideIcons.CreditCard, keywords: ['credit', 'card', '信用卡', '支付'] },
  { name: 'DollarSign', category: '商业', component: LucideIcons.DollarSign, keywords: ['dollar', 'money', '美元', '钱'] },
  { name: 'TrendingUp', category: '商业', component: LucideIcons.TrendingUp, keywords: ['trending', 'up', '上涨', '趋势'] },
  { name: 'TrendingDown', category: '商业', component: LucideIcons.TrendingDown, keywords: ['trending', 'down', '下跌', '趋势'] },
  { name: 'BarChart2', category: '商业', component: LucideIcons.BarChart2, keywords: ['chart', 'bar', '柱状图', '图表'] },
  { name: 'LineChart', category: '商业', component: LucideIcons.LineChart, keywords: ['chart', 'line', '折线图', '图表'] },
  { name: 'Truck', category: '商业', component: LucideIcons.Truck, keywords: ['truck', 'delivery', '卡车', '配送'] },
  { name: 'Gift', category: '商业', component: LucideIcons.Gift, keywords: ['gift', 'present', '礼物'] },
  { name: 'Wallet', category: '商业', component: LucideIcons.Wallet, keywords: ['wallet', 'money', '钱包', '钱'] },
  { name: 'Coins', category: '商业', component: LucideIcons.Coins, keywords: ['coins', 'money', '硬币', '钱'] },
  { name: 'Percent', category: '商业', component: LucideIcons.Percent, keywords: ['percent', 'discount', '百分比', '折扣'] },
  { name: 'Receipt', category: '商业', component: LucideIcons.Receipt, keywords: ['receipt', 'bill', '收据', '账单'] },
  { name: 'Store', category: '商业', component: LucideIcons.Store, keywords: ['store', 'shop', '商店', '店铺'] },

  // 天气类 (8个)
  { name: 'Sun', category: '天气', component: LucideIcons.Sun, keywords: ['sun', 'sunny', '太阳', '晴天'] },
  { name: 'Moon', category: '天气', component: LucideIcons.Moon, keywords: ['moon', 'night', '月亮', '夜晚'] },
  { name: 'Cloud', category: '天气', component: LucideIcons.Cloud, keywords: ['cloud', '云', '多云'] },
  { name: 'CloudRain', category: '天气', component: LucideIcons.CloudRain, keywords: ['cloud', 'rain', '雨', '下雨'] },
  { name: 'CloudSnow', category: '天气', component: LucideIcons.CloudSnow, keywords: ['cloud', 'snow', '雪', '下雪'] },
  { name: 'CloudDrizzle', category: '天气', component: LucideIcons.CloudDrizzle, keywords: ['cloud', 'drizzle', '毛毛雨', '小雨'] },
  { name: 'CloudFog', category: '天气', component: LucideIcons.CloudFog, keywords: ['cloud', 'fog', '雾', '雾天'] },
  { name: 'Sunrise', category: '天气', component: LucideIcons.Sunrise, keywords: ['sunrise', '日出', '早晨'] },

  // 其他类 (26个)
  { name: 'Tag', category: '其他', component: LucideIcons.Tag, keywords: ['tag', 'label', '标签', '标记'] },
  { name: 'Flag', category: '其他', component: LucideIcons.Flag, keywords: ['flag', '旗帜', '标记'] },
  { name: 'Bookmark', category: '其他', component: LucideIcons.Bookmark, keywords: ['bookmark', '书签', '收藏'] },
  { name: 'Calendar', category: '其他', component: LucideIcons.Calendar, keywords: ['calendar', '日历'] },
  { name: 'Clock', category: '其他', component: LucideIcons.Clock, keywords: ['clock', 'time', '时钟', '时间'] },
  { name: 'MapPin', category: '其他', component: LucideIcons.MapPin, keywords: ['map', 'pin', 'location', '地图', '位置'] },
  { name: 'Navigation', category: '其他', component: LucideIcons.Navigation, keywords: ['navigation', 'compass', '导航', '指南针'] },
  { name: 'Anchor', category: '其他', component: LucideIcons.Anchor, keywords: ['anchor', '锚'] },
  { name: 'Coffee', category: '其他', component: LucideIcons.Coffee, keywords: ['coffee', '咖啡'] },
  { name: 'Lightbulb', category: '其他', component: LucideIcons.Lightbulb, keywords: ['lightbulb', 'idea', '灯泡', '想法'] },
  { name: 'Rocket', category: '其他', component: LucideIcons.Rocket, keywords: ['rocket', '火箭', '发射'] },
  { name: 'Target', category: '其他', component: LucideIcons.Target, keywords: ['target', 'goal', '目标'] },
  { name: 'Trophy', category: '其他', component: LucideIcons.Trophy, keywords: ['trophy', 'award', '奖杯', '胜利'] },
  { name: 'Eye', category: '其他', component: LucideIcons.Eye, keywords: ['eye', 'view', '眼睛', '查看'] },
  { name: 'EyeOff', category: '其他', component: LucideIcons.EyeOff, keywords: ['eye', 'off', 'hide', '隐藏'] },
  { name: 'Globe', category: '其他', component: LucideIcons.Globe, keywords: ['globe', 'world', '地球', '世界'] },
  { name: 'Wifi', category: '其他', component: LucideIcons.Wifi, keywords: ['wifi', 'wireless', '无线', '网络'] },
  { name: 'WifiOff', category: '其他', component: LucideIcons.WifiOff, keywords: ['wifi', 'off', '无网络', '断网'] },
  { name: 'Bluetooth', category: '其他', component: LucideIcons.Bluetooth, keywords: ['bluetooth', '蓝牙'] },
  { name: 'Battery', category: '其他', component: LucideIcons.Battery, keywords: ['battery', 'power', '电池', '电量'] },
  { name: 'BatteryCharging', category: '其他', component: LucideIcons.BatteryCharging, keywords: ['battery', 'charging', '充电'] },
  { name: 'Power', category: '其他', component: LucideIcons.Power, keywords: ['power', 'on', 'off', '电源', '开关'] },
  { name: 'Printer', category: '其他', component: LucideIcons.Printer, keywords: ['printer', 'print', '打印机', '打印'] },
  { name: 'Scan', category: '其他', component: LucideIcons.Scan, keywords: ['scan', 'qr', '扫描', '二维码'] },
  { name: 'QrCode', category: '其他', component: LucideIcons.QrCode, keywords: ['qr', 'code', '二维码'] },
  { name: 'Compass', category: '其他', component: LucideIcons.Compass, keywords: ['compass', 'direction', '指南针', '方向'] },
];

// 获取所有分类
export const getCategories = (): IconCategory[] => {
  const categories = new Set<IconCategory>();
  ICON_LIBRARY.forEach(icon => categories.add(icon.category));
  return Array.from(categories);
};

// 根据分类筛选图标
export const getIconsByCategory = (category: IconCategory): IconConfig[] => {
  return ICON_LIBRARY.filter(icon => icon.category === category);
};

// 搜索图标
export const searchIcons = (query: string): IconConfig[] => {
  const lowerQuery = query.toLowerCase();
  return ICON_LIBRARY.filter(icon =>
    icon.name.toLowerCase().includes(lowerQuery) ||
    icon.keywords.some(keyword => keyword.toLowerCase().includes(lowerQuery))
  );
};
