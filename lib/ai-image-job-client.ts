interface AIImageJobResult {
  url: string;
  original_url?: string;
  persisted?: boolean;
}

interface AIImageJob {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  result?: AIImageJobResult;
  error?: string;
}

interface AIImageJobResponse {
  job?: AIImageJob;
  error?: string;
}

const POLL_INTERVAL_MS = 2000;
const JOB_TIMEOUT_MS = 240000;

export async function createAndPollAIImageJob(
  endpoint: string,
  payload: Record<string, unknown>
): Promise<string> {
  const createResponse = await fetchJsonWithRetry<AIImageJobResponse>(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!createResponse.job?.id) {
    throw new Error(createResponse.error || '创建生图任务失败');
  }

  const startedAt = Date.now();
  const jobId = createResponse.job.id;

  while (Date.now() - startedAt < JOB_TIMEOUT_MS) {
    const pollResponse = await fetchJsonWithRetry<AIImageJobResponse>(
      `${endpoint}?jobId=${encodeURIComponent(jobId)}`,
      { method: 'GET' }
    );
    const job = pollResponse.job;

    if (!job) {
      throw new Error(pollResponse.error || '查询生图任务失败');
    }

    if (job.status === 'succeeded') {
      if (!job.result?.url) {
        throw new Error('返回数据中没有图片 URL');
      }
      return job.result.url;
    }

    if (job.status === 'failed') {
      throw new Error(job.error || '生成图片失败');
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error('生成图片超时，请稍后重试');
}

async function fetchJsonWithRetry<T>(
  url: string,
  init: RequestInit,
  maxAttempts = 3
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await fetch(url, init);
      const data = await response.json().catch(() => null) as T | null;

      if (!response.ok) {
        const errorMessage = readErrorMessage(data) || `请求失败 (${response.status})`;
        throw new Error(errorMessage);
      }

      if (!data) {
        throw new Error('接口返回数据格式错误');
      }

      return data;
    } catch (error) {
      lastError = error;

      if (!isNetworkFetchError(error) || attempt === maxAttempts) {
        break;
      }

      await sleep(attempt * 1000);
    }
  }

  if (isNetworkFetchError(lastError)) {
    throw new Error('网络连接中断，已自动重试但仍未恢复，请稍后再试');
  }

  throw lastError instanceof Error ? lastError : new Error('请求失败');
}

function readErrorMessage(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const error = (data as { error?: unknown }).error;
  return typeof error === 'string' ? error : '';
}

function isNetworkFetchError(error: unknown): boolean {
  if (!(error instanceof TypeError)) return false;
  return /fetch|network|load failed|failed to fetch/i.test(error.message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
