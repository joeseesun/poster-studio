'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState, useEffect } from 'react';
import { ExternalLink, Loader2, RefreshCw } from 'lucide-react';
import {
  AI_AUTH_HEADER_OPTIONS,
  AIModelOption,
  AI_PROVIDER_PRESETS,
  AI_PROVIDER_STORAGE_KEYS,
  AI_REQUEST_FORMAT_OPTIONS,
  AIAuthHeader,
  AIProviderId,
  AIRequestFormat,
  DEFAULT_AI_PROVIDER_ID,
  getAIProviderPreset,
  isBuiltInAIProvider,
  isBuiltInAIProviderEnabled,
  isAIAuthHeader,
  isAIRequestFormat,
  resolveBrowserAIProviderId,
} from '@/lib/ai-provider-config';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// 检查是否已配置 API Key
export function hasApiKeyConfigured(): boolean {
  if (typeof window === 'undefined') return false;
  const providerId = resolveBrowserAIProviderId(localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.providerId));
  if (isBuiltInAIProvider(providerId)) return isBuiltInAIProviderEnabled(providerId);

  const apiKey = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.apiKey);
  return !!(apiKey && apiKey.trim());
}

// Remove.bg 默认有服务端内置配置；用户可选填自己的 Key 覆盖。
export function hasRemoveBgApiKeyConfigured(): boolean {
  return true;
}

export default function SettingsDialog({ isOpen, onClose }: SettingsDialogProps) {
  const [providerId, setProviderId] = useState<AIProviderId>(DEFAULT_AI_PROVIDER_ID);
  const [apiKey, setApiKey] = useState('');
  const [apiEndpoint, setApiEndpoint] = useState('');
  const [modelId, setModelId] = useState('');
  const [authHeader, setAuthHeader] = useState<AIAuthHeader>('bearer');
  const [requestFormat, setRequestFormat] = useState<AIRequestFormat>('seedream');
  const [removeBgApiKey, setRemoveBgApiKey] = useState('');
  const [remoteModelOptions, setRemoteModelOptions] = useState<AIModelOption[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [modelSource, setModelSource] = useState('');
  const [modelLoadError, setModelLoadError] = useState('');
  const isBuiltInProvider = isBuiltInAIProvider(providerId);
  const activeProvider = getAIProviderPreset(providerId);
  const modelOptions = providerId === 'hiapi' && remoteModelOptions.length > 0
    ? remoteModelOptions
    : activeProvider.modelOptions || [];

  useEffect(() => {
    if (isOpen) {
      const savedProviderId = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.providerId);
      const nextProviderId = resolveBrowserAIProviderId(savedProviderId);
      const provider = getAIProviderPreset(nextProviderId);
      const savedApiKey = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.apiKey) || '';
      const storedEndpoint = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.apiEndpoint) || provider.endpoint;
      const savedEndpoint = nextProviderId === 'hiapi' ? normalizeHiapiEndpoint(storedEndpoint, provider.endpoint) : storedEndpoint;
      const storedModelId = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.modelId);
      const savedModelId = provider.modelOptions?.length
        ? provider.modelOptions.find((option) => option.value === storedModelId)?.value || provider.modelId
        : storedModelId || provider.modelId;
      const savedAuthHeader = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.authHeader);
      const savedRequestFormat = localStorage.getItem(AI_PROVIDER_STORAGE_KEYS.requestFormat);
      const savedRemoveBgApiKey = localStorage.getItem('removebg_api_key') || '';

      setProviderId(nextProviderId);
      setApiKey(savedApiKey);
      setApiEndpoint(savedEndpoint);
      setModelId(savedModelId);
      setAuthHeader(isAIAuthHeader(savedAuthHeader) ? savedAuthHeader : provider.authHeader);
      setRequestFormat(nextProviderId === 'hiapi'
        ? 'hiapi-task'
        : isAIRequestFormat(savedRequestFormat) ? savedRequestFormat : provider.requestFormat
      );
      setRemoveBgApiKey(savedRemoveBgApiKey);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    if (providerId !== 'hiapi') {
      setRemoteModelOptions([]);
      setModelSource('');
      setModelLoadError('');
      return;
    }

    loadProviderModels(providerId);
  }, [isOpen, providerId]);

  const handleProviderChange = (nextProviderId: AIProviderId) => {
    const provider = getAIProviderPreset(nextProviderId);
    setProviderId(nextProviderId);
    setApiEndpoint(provider.endpoint);
    setModelId(provider.modelId);
    setAuthHeader(provider.authHeader);
    setRequestFormat(provider.requestFormat);
    if (nextProviderId !== 'hiapi') {
      setRemoteModelOptions([]);
      setModelSource('');
      setModelLoadError('');
    }
  };

  const loadProviderModels = async (targetProviderId: AIProviderId = providerId) => {
    if (targetProviderId !== 'hiapi') return;

    setIsLoadingModels(true);
    setModelLoadError('');
    try {
      const response = await fetch('/api/ai-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: targetProviderId,
          apiKey: apiKey.trim(),
          apiEndpoint: apiEndpoint.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || '模型列表加载失败');
      }

      const models = Array.isArray(data.models) ? data.models as AIModelOption[] : [];
      setRemoteModelOptions(models);
      setModelSource(typeof data.source === 'string' ? data.source : '');
      if (models.length > 0 && !models.some((option) => option.value === modelId)) {
        setModelId(models[0].value);
      }
    } catch (error) {
      setModelLoadError(error instanceof Error ? error.message : '模型列表加载失败');
    } finally {
      setIsLoadingModels(false);
    }
  };

  const handleSaveSettings = () => {
    localStorage.setItem(AI_PROVIDER_STORAGE_KEYS.providerId, providerId);

    if (!isBuiltInProvider && apiKey.trim()) {
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
                {AI_PROVIDER_PRESETS.map((provider) => {
                  const isUnavailable = provider.builtIn && !isBuiltInAIProviderEnabled(provider.id);
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => !isUnavailable && handleProviderChange(provider.id)}
                      disabled={isUnavailable}
                      className={`rounded-md border px-3 py-2 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55 ${
                        providerId === provider.id
                          ? 'border-gray-900 bg-gray-900 text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-900 disabled:hover:border-gray-200'
                      }`}
                    >
                      <span className="block text-sm font-medium">{provider.label}</span>
                      <span className={`mt-1 block text-xs leading-4 ${
                        providerId === provider.id ? 'text-gray-200' : 'text-gray-500'
                      }`}>
                        {isUnavailable ? '服务端未启用，请使用自有 API 配置。' : provider.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="model-id">模型 ID *</Label>
                {providerId === 'hiapi' && (
                  <button
                    type="button"
                    onClick={() => loadProviderModels('hiapi')}
                    disabled={isLoadingModels}
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary disabled:opacity-50"
                  >
                    {isLoadingModels ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    刷新模型
                  </button>
                )}
              </div>
              {modelOptions.length > 0 ? (
                <select
                  id="model-id"
                  value={modelId || activeProvider.modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none transition-[color,box-shadow] focus:border-gray-900 focus:ring-1 focus:ring-gray-900"
                >
                  {modelOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id="model-id"
                  type="text"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                  placeholder={activeProvider.modelId || '输入模型 ID'}
                  disabled={isBuiltInProvider}
                />
              )}
              {isLoadingModels ? (
                <p className="text-xs text-muted-foreground">
                  正在从 HiAPI 模型接口加载...
                </p>
              ) : modelLoadError ? (
                <p className="text-xs text-amber-600">
                  模型列表刷新失败，已使用默认列表：{modelLoadError}
                </p>
              ) : modelOptions.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {modelOptions.find((option) => option.value === (modelId || activeProvider.modelId))?.description || activeProvider.description}
                  {providerId === 'hiapi' && modelSource && ` · 来源：${modelSource === 'hiapi-pricing' ? 'HiAPI 模型接口' : '默认列表'}`}
                </p>
              ) : null}
            </div>

            {!isBuiltInProvider && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="api-key">API Key *</Label>
                  {activeProvider.apiKeyUrl && (
                    <a
                      href={activeProvider.apiKeyUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                    >
                      获取 API
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="输入你的 API Key"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="api-endpoint">API 端点</Label>
              <Input
                id="api-endpoint"
                type="url"
                value={apiEndpoint}
                onChange={(e) => setApiEndpoint(e.target.value)}
                placeholder={activeProvider.endpoint || 'https://api.example.com/v1/images/generations'}
                disabled={isBuiltInProvider}
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
                  disabled={isBuiltInProvider}
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
                  disabled={isBuiltInProvider || providerId === 'hiapi'}
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
              <Label htmlFor="removebg-api-key">自有 API Key（可选）</Label>
              <Input
                id="removebg-api-key"
                type="password"
                value={removeBgApiKey}
                onChange={(e) => setRemoveBgApiKey(e.target.value)}
                placeholder="默认使用乔木内置服务"
              />
              <p className="text-xs text-muted-foreground">
                不填写时使用乔木服务端内置 Remove.bg；填写后会优先使用你自己的 Key。
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

function normalizeHiapiEndpoint(endpoint: string, fallback: string): string {
  const trimmed = endpoint.trim().replace(/\/+$/, '');
  if (!trimmed) return fallback;
  if (trimmed.endsWith('/v1/tasks')) return trimmed;
  if (trimmed.endsWith('/v1/images/generations')) {
    return `${trimmed.replace(/\/v1\/images\/generations$/i, '')}/v1/tasks`;
  }
  if (trimmed.endsWith('/v1')) return `${trimmed}/tasks`;
  if (trimmed === 'https://api.hiapi.ai' || trimmed === 'https://www.hiapi.ai') {
    return `${trimmed}/v1/tasks`;
  }
  return trimmed;
}
