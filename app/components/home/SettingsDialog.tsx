'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import {
  AI_AUTH_HEADER_OPTIONS,
  AI_PROVIDER_PRESETS,
  AI_PROVIDER_STORAGE_KEYS,
  AI_REQUEST_FORMAT_OPTIONS,
  AIAuthHeader,
  AIProviderId,
  AIRequestFormat,
  DEFAULT_AI_PROVIDER_ID,
  getAIProviderPreset,
  isAIAuthHeader,
  isAIProviderId,
  isAIRequestFormat,
} from '@/lib/ai-provider-config';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// 检查是否已配置 API Key
export function hasApiKeyConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  const apiKey = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.apiKey);
  return !!(apiKey && apiKey.trim());
}

// 检查是否已配置 Remove.bg API Key
export function hasRemoveBgApiKeyConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  const apiKey = localStorage.getItem('removebg_api_key');
  return !!(apiKey && apiKey.trim());
}

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [providerId, setProviderId] = useState<AIProviderId>(DEFAULT_AI_PROVIDER_ID);
  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [modelId, setModelId] = useState('');
  const [authHeader, setAuthHeader] = useState<AIAuthHeader>('bearer');
  const [requestFormat, setRequestFormat] = useState<AIRequestFormat>('seedream');
  const [removeBgApiKey, setRemoveBgApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      const savedProviderId = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.providerId);
      const nextProviderId = isAIProviderId(savedProviderId) ? savedProviderId : DEFAULT_AI_PROVIDER_ID;
      const provider = getAIProviderPreset(nextProviderId);
      const savedApiKey = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.apiKey) || '';
      const savedEndpoint = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.apiEndpoint) || provider.endpoint;
      const savedModelId = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.modelId) || provider.modelId;
      const savedAuthHeader = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.authHeader);
      const savedRequestFormat = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.requestFormat);
      const savedRemoveBgApiKey = localStorage.getItem('removebg_api_key') || '';

      setProviderId(nextProviderId);
      setApiKey(savedApiKey);
      setApiEndpoint(savedEndpoint);
      setModelId(savedModelId);
      setAuthHeader(isAIAuthHeader(savedAuthHeader) ? savedAuthHeader : provider.authHeader);
      setRequestFormat(isAIRequestFormat(savedRequestFormat) ? savedRequestFormat : provider.requestFormat);
      setRemoveBgApiKey(savedRemoveBgApiKey);
    }
  }, [isOpen]);

  const handleProviderChange = (nextProviderId: AIProviderId) => {
    const provider = getAIProviderPreset(nextProviderId);
    setProviderId(nextProviderId);
    setApiEndpoint(provider.endpoint);
    setModelId(provider.modelId);
    setAuthHeader(provider.authHeader);
    setRequestFormat(provider.requestFormat);
  };

  const handleSaveSettings = () => {
    localStorage.setItem(AI_PROVIDER_STORAGE_KEYS.providerId, providerId);

    if (apiKey.trim()) {
      localStorage.setItem(AI_PROVIDER_STORAGE_KEYS.apiKey, apiKey);
    } else {
      localStorage.removeItem(AI_PROVIDER_STORAGE_KEYS.apiKey);
    }

    if (apiEndpoint.trim()) {
      localStorage.setItem(AI_PROVIDER_STORAGE_KEYS.apiEndpoint, apiEndpoint);
    } else {
      localStorage.removeItem(AI_PROVIDER_STORAGE_KEYS.apiEndpoint);
    }

    if (modelId.trim()) {
      localStorage.setItem(AI_PROVIDER_STORAGE_KEYS.modelId, modelId);
    } else {
      localStorage.removeItem(AI_PROVIDER_STORAGE_KEYS.modelId);
    }

    localStorage.setItem(AI_PROVIDER_STORAGE_KEYS.authHeader, authHeader);
    localStorage.setItem(AI_PROVIDER_STORAGE_KEYS.requestFormat, requestFormat);

    if (removeBgApiKey.trim()) {
      localStorage.setItem('removebg_api_key', removeBgApiKey);
    } else {
      localStorage.removeItem('removebg_api_key');
    }

    onClose();
  };

  const handleResetSettings = () => {
    const provider = getAIProviderPreset(DEFAULT_AI_PROVIDER_ID);

    setProviderId(provider.id);
    setApiKey('');
    setApiEndpoint(provider.endpoint);
    setModelId(provider.modelId);
    setAuthHeader(provider.authHeader);
    setRequestFormat(provider.requestFormat);
    setRemoveBgApiKey('');

    localStorage.setItem(AI_PROVIDER_STORAGE_KEYS.providerId, provider.id);
    localStorage.removeItem(AI_PROVIDER_STORAGE_KEYS.apiKey);
    localStorage.setItem(AI_PROVIDER_STORAGE_KEYS.apiEndpoint, provider.endpoint);
    localStorage.removeItem(AI_PROVIDER_STORAGE_KEYS.modelId);
    localStorage.setItem(AI_PROVIDER_STORAGE_KEYS.authHeader, provider.authHeader);
    localStorage.setItem(AI_PROVIDER_STORAGE_KEYS.requestFormat, provider.requestFormat);
    localStorage.removeItem('removebg_api_key');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="!left-[50vw] !top-6 translate-y-0 !max-w-[calc(100vw-32px)] !max-h-[calc(100vh-48px)] overflow-y-auto sm:!max-w-[680px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>⚙️ AI 生图配置</span>
            <a
              href="https://xiangyangqiaomu.feishu.cn/wiki/OK3iwTHxwiQ3Ghkug16c3r1rnKe"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1 font-normal"
            >
              查看教程
              <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* AI 生图配置 */}
          <div className="space-y-4 pb-4 border-b">
            <h3 className="text-sm font-semibold text-muted-foreground">AI 生图配置</h3>

            <div className="space-y-2">
              <Label>服务商预设</Label>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {AI_PROVIDER_PRESETS.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => handleProviderChange(provider.id)}
                    className={`rounded-md border px-3 py-2 text-left transition-colors ${
                      providerId === provider.id
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-900'
                    }`}
                  >
                    <span className="block text-sm font-medium">{provider.label}</span>
                    <span className={`mt-1 block text-xs leading-4 ${
                      providerId === provider.id ? 'text-gray-200' : 'text-gray-500'
                    }`}>
                      {provider.description}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="model-id">模型 ID *</Label>
              <Input
                id="model-id"
                type="text"
                value={modelId}
                onChange={(e) => setModelId(e.target.value)}
                placeholder={getAIProviderPreset(providerId).modelId || '输入模型 ID'}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-key">API Key *</Label>
              <Input
                id="api-key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="输入你的 API Key"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api-endpoint">API 端点</Label>
              <Input
                id="api-endpoint"
                type="url"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder={getAIProviderPreset(providerId).endpoint || 'https://api.example.com/v1/images/generations'}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="auth-header">认证方式</Label>
                <select
                  id="auth-header"
                  value={authHeader}
                  onChange={(e) => setAuthHeader(e.target.value as AIAuthHeader)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                >
                  {AI_AUTH_HEADER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="request-format">请求格式</Label>
                <select
                  id="request-format"
                  value={requestFormat}
                  onChange={(e) => setRequestFormat(e.target.value as AIRequestFormat)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                >
                  {AI_REQUEST_FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Remove.bg 配置 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-muted-foreground">Remove.bg 配置</h3>
              <a
                href="https://www.remove.bg/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
              >
                获取 API
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>

            <div className="space-y-2">
              <Label htmlFor="removebg-api-key">API Key</Label>
              <Input
                id="removebg-api-key"
                type="password"
                value={removeBgApiKey}
                onChange={(e) => setRemoveBgApiKey(e.target.value)}
                placeholder="输入你的 Remove.bg API Key"
              />
              <p className="text-xs text-muted-foreground">
                用于一键去除图片背景功能
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button variant="outline" onClick={handleResetSettings}>
            重置
          </Button>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button variant="outline" onClick={handleSaveSettings}>
              保存设置
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
