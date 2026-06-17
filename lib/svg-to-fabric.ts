/**
 * SVG 转 Fabric.js 工具函数
 * 将 Lucide 图标的 SVG 转换为 Fabric.js 对象
 */

import { fabric } from 'fabric';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';

export interface SVGToFabricOptions {
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  left?: number;
  top?: number;
}

/**
 * 将 React 图标组件转换为 SVG 字符串（客户端方法）
 * 使用异步渲染方法
 *
 * 注意：Lucide 图标是 forwardRef 组件，所以 IconComponent 是一个对象而不是函数
 */
export async function iconToSVGString(IconComponent: any, size: number = 24): Promise<string> {
  // 创建临时容器
  const container = document.createElement('div');
  container.style.cssText = 'position: absolute; left: -9999px; top: -9999px;';
  document.body.appendChild(container);

  try {
    // 创建 root
    const root = createRoot(container);

    // 渲染图标
    root.render(createElement(IconComponent, {
      size,
      strokeWidth: 2,
      color: 'currentColor'
    }));

    // 等待 DOM 更新（使用 Promise + setTimeout 确保渲染完成）
    await new Promise(resolve => setTimeout(resolve, 0));

    // 获取渲染的 SVG
    const svgElement = container.querySelector('svg');
    if (!svgElement) {
      throw new Error('No SVG element found after rendering');
    }

    // 获取 SVG 字符串
    const svgString = svgElement.outerHTML;

    // 清理
    root.unmount();
    document.body.removeChild(container);

    return svgString;
  } catch (error) {
    // 确保清理
    if (container.parentNode) {
      document.body.removeChild(container);
    }
    console.error('Failed to convert icon to SVG string:', error);
    throw error;
  }
}

/**
 * 将 SVG 字符串转换为 Fabric.js 对象
 */
export function svgStringToFabric(
  svgString: string,
  options: SVGToFabricOptions = {}
): Promise<fabric.Group | fabric.Path> {
  return new Promise((resolve, reject) => {
    try {
      // 使用 fabric.loadSVGFromString 解析 SVG
      fabric.loadSVGFromString(svgString, (objects, opts) => {
        if (!objects || objects.length === 0) {
          reject(new Error('Failed to parse SVG'));
          return;
        }

        // 如果只有一个对象，直接返回
        if (objects.length === 1) {
          const obj = objects[0];
          applyOptions(obj, options);
          resolve(obj as fabric.Path);
          return;
        }

        // 多个对象，创建 Group
        const group = new fabric.Group(objects, {
          left: options.left || 0,
          top: options.top || 0,
        });

        applyOptions(group, options);
        resolve(group);
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * 应用选项到 Fabric 对象
 */
function applyOptions(obj: fabric.Object, options: SVGToFabricOptions) {
  const {
    width,
    height,
    fill,
    stroke,
    strokeWidth,
    left,
    top,
  } = options;

  // 设置位置
  if (left !== undefined) obj.set('left', left);
  if (top !== undefined) obj.set('top', top);

  // 设置大小（通过缩放）
  if (width || height) {
    const currentWidth = obj.width || 1;
    const currentHeight = obj.height || 1;

    if (width && height) {
      obj.scaleToWidth(width);
      obj.scaleToHeight(height);
    } else if (width) {
      obj.scaleToWidth(width);
    } else if (height) {
      obj.scaleToHeight(height);
    }
  }

  // 设置颜色
  if (fill !== undefined) {
    if (obj.type === 'group') {
      // Group 需要递归设置所有子对象的颜色
      (obj as fabric.Group).forEachObject((child) => {
        // 只设置有 fill 属性的对象（排除纯描边对象）
        if (child.fill !== undefined && child.fill !== null && child.fill !== '') {
          child.set('fill', fill);
        }
      });
    } else {
      if (obj.fill !== undefined && obj.fill !== null && obj.fill !== '') {
        obj.set('fill', fill);
      }
    }
  }

  if (stroke !== undefined) {
    if (obj.type === 'group') {
      (obj as fabric.Group).forEachObject((child) => {
        // 设置所有有 stroke 的对象
        if (child.stroke !== undefined && child.stroke !== null && child.stroke !== '') {
          child.set('stroke', stroke);
        }
      });
    } else {
      if (obj.stroke !== undefined && obj.stroke !== null && obj.stroke !== '') {
        obj.set('stroke', stroke);
      }
    }
  }

  if (strokeWidth !== undefined) {
    if (obj.type === 'group') {
      (obj as fabric.Group).forEachObject((child) => {
        if (child.strokeWidth !== undefined && child.strokeWidth !== null) {
          child.set('strokeWidth', strokeWidth);
        }
      });
    } else {
      if (obj.strokeWidth !== undefined && obj.strokeWidth !== null) {
        obj.set('strokeWidth', strokeWidth);
      }
    }
  }

  // 设置原点为中心
  obj.set({
    originX: 'center',
    originY: 'center',
  });
}

/**
 * 将 React 图标组件直接转换为 Fabric.js 对象
 */
export async function iconComponentToFabric(
  IconComponent: any,
  options: SVGToFabricOptions = {}
): Promise<fabric.Group | fabric.Path> {
  const size = options.width || options.height || 60;
  const svgString = await iconToSVGString(IconComponent, size);
  return svgStringToFabric(svgString, options);
}

/**
 * 更新 SVG 对象的颜色
 */
export function updateSVGColor(
  obj: fabric.Object,
  fill?: string,
  stroke?: string
) {
  if (obj.type === 'group') {
    (obj as fabric.Group).forEachObject((child) => {
      if (fill !== undefined && child.fill !== undefined && child.fill !== null && child.fill !== '') {
        child.set('fill', fill);
      }
      if (stroke !== undefined && child.stroke !== undefined && child.stroke !== null && child.stroke !== '') {
        child.set('stroke', stroke);
      }
    });
  } else {
    if (fill !== undefined && obj.fill !== undefined && obj.fill !== null && obj.fill !== '') {
      obj.set('fill', fill);
    }
    if (stroke !== undefined && obj.stroke !== undefined && obj.stroke !== null && obj.stroke !== '') {
      obj.set('stroke', stroke);
    }
  }
}

/**
 * 更新 SVG 对象的描边宽度
 */
export function updateSVGStrokeWidth(
  obj: fabric.Object,
  strokeWidth: number
) {
  if (obj.type === 'group') {
    (obj as fabric.Group).forEachObject((child) => {
      if (child.strokeWidth !== undefined && child.strokeWidth !== null) {
        child.set('strokeWidth', strokeWidth);
      }
    });
  } else {
    if (obj.strokeWidth !== undefined && obj.strokeWidth !== null) {
      obj.set('strokeWidth', strokeWidth);
    }
  }
}
