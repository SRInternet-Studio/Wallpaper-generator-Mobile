import { fetch } from '@tauri-apps/plugin-http';
import { getSetting } from './settings';
import { writeFile, mkdir, exists } from '@tauri-apps/plugin-fs';
import { sendNotification } from '@tauri-apps/plugin-notification';
import { downloadDir, join, tempDir } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';

const GITHUB_API_URL = 'https://api.github.com/repos/IntelliMarkets/Wallpaper_API_Index/contents/';

export interface ApiSource {
  name: string;
  content: any;
  category: string;
}

let apiCache: ApiSource[] | null = null;

export function clearApiCache(): void {
  apiCache = null;
}

async function fetchJson<T>(url: string, pat?: string): Promise<T> {
    const headers: Record<string, string> = {
        'Accept': 'application/vnd.github.v3+json'
    };
    if (pat) {
        headers['Authorization'] = `token ${pat}`;
    }

    const response = await fetch(url, { 
        method: 'GET',
        headers
    });
    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
}

export async function getApiCategories(): Promise<string[]> {
  try {
    const pat = await getSetting<string>('github_pat');
    const data = await fetchJson<any[]>(GITHUB_API_URL, pat || undefined);
    return data.filter(item => item.type === 'dir').map(item => item.name);
  } catch (error) {
    console.error('Error fetching API categories:', error);
    return [];
  }
}

export async function getApisByCategory(category: string): Promise<ApiSource[]> {
  try {
    const pat = await getSetting<string>('github_pat');
    const files = await fetchJson<any[]>(`${GITHUB_API_URL}${category}`, pat || undefined);
    
    const apiPromises = files
      .filter(file => file.name.endsWith('.api.json'))
      .map(async (file: any) => {
        try {
          const apiName = file.name.replace('.api.json', '');
          const content = await fetchJson<any>(file.download_url, pat || undefined);
          return { name: apiName, content, category };
        } catch (e) {
          console.error(`Error processing file ${file.name}:`, e);
          return null;
        }
      });

    const results = await Promise.all(apiPromises);
    return results.filter((item): item is ApiSource => item !== null);
  } catch (error) {
    console.error(`Error fetching APIs for category ${category}:`, error);
    return [];
  }
}

export async function getAllApis(): Promise<ApiSource[]> {
    if (apiCache) {
        return apiCache;
    }
    try {
        const categories = await getApiCategories();
        const allApisPromises = categories.map(category => getApisByCategory(category));
        const apisByCategory = await Promise.all(allApisPromises);
        apiCache = apisByCategory.flat();
        return apiCache;
    } catch (error) {
        console.error('Error fetching all APIs:', error);
        return [];
    }
}

export async function getApiByName(apiName: string): Promise<ApiSource | null> {
    try {
        const allApis = await getAllApis();
        return allApis.find(a => a.name === apiName) || null;
    } catch (error) {
        console.error(`Error fetching API ${apiName}:`, error);
        return null;
    }
}

function constructApiUrl(api: string, payload: Record<string, any>, apiConfig: ApiSource): string {
    let url = api.replace(/\/$/, '').replace(/\?$/, '');
    const pathParams: string[] = [];
    const queryParams: Record<string, string> = {};

    // This logic mirrors the Python construct_api function
    for (const param of apiConfig.content.parameters) {
        const key = param.name;
        const value = payload[key];

        if (key === null || key === '') { // Path parameter
            if (value !== undefined && value !== null) {
                pathParams.push(String(value));
            }
        } else { // Query parameter
            if (value !== undefined && value !== null) {
                const split_str = param.split_str || '|';
                if (Array.isArray(value)) {
                    queryParams[key] = value.join(split_str);
                } else {
                    queryParams[key] = String(value);
                }
            }
        }
    }

    if (pathParams.length > 0) {
        url += '/' + pathParams.join('/');
    }

    if (Object.keys(queryParams).length > 0) {
        const queryString = new URLSearchParams(queryParams).toString();
        url += '?' + queryString;
    }

    return url;
}

export async function generateImages(apiConfig: ApiSource, payload: Record<string, any>): Promise<string[]> {
    console.log("Generating images with config:", apiConfig);
    console.log("Payload:", payload);

    const { link, func, response: responseConfig } = apiConfig.content;
    const method = func.toUpperCase();
    let finalUrl = link;

    const options: RequestInit = { method };

    if (method === 'GET' || method === 'HEAD') {
        finalUrl = constructApiUrl(link, payload, apiConfig);
    } else {
        options.body = JSON.stringify(payload);
        options.headers = { 'Content-Type': 'application/json' };
    }

    try {
        console.log(`Making ${method} request to: ${finalUrl}`);
        if (options.body) {
            console.log("Request body:", options.body);
        }

        const response = await fetch(finalUrl, options);
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const textData = await response.text();
        console.log("Received response data:", textData);
        let imageUrls: any[] = [];

        try {
            // Try to parse as JSON first
            const data = JSON.parse(textData);
            const path = responseConfig.image?.path || '';
            
            let extractedUrls = path.split('.').reduce((acc: any, part: string) => {
                if (acc === null || typeof acc === 'undefined') return null;
                if (part === '[*]') {
                    return Array.isArray(acc) ? acc.flatMap((item: any) => item) : null;
                }
                return Array.isArray(acc) ? acc.map((item: any) => item?.[part]) : acc?.[part];
            }, data);

            if (extractedUrls) {
                imageUrls = Array.isArray(extractedUrls) ? extractedUrls : [extractedUrls];
            }

        } catch (e) {
            // If JSON parsing fails, treat the response as a list of URLs separated by newlines
            imageUrls = textData.split('\n').filter(url => url.trim().startsWith('http'));
        }

        return imageUrls.filter(Boolean);

    } catch (error) {
        console.error('Failed to generate images:', error);
        return [];
    }
}

async function downloadImageToTemp(imageUrl: string): Promise<string | null> {
    try {
        const response = await fetch(imageUrl, { method: 'GET' });
        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const saveData = new Uint8Array(arrayBuffer);
        
        const temp = await tempDir();
        const fileName = new URL(imageUrl).pathname.split('/').pop()?.replace(/[<>:"/\\|?*]/g, '_') || `image-${Date.now()}.jpg`;
        const filePath = await join(temp, fileName);

        await writeFile(filePath, saveData);
        return filePath;
    } catch (error) {
        console.error('Failed to download image to temp:', error);
        await sendNotification({
            title: '下载失败',
            body: `无法下载图片: ${String(error)}`
        });
        return null;
    }
}

export async function shareImage(imageUrl: string): Promise<void> {
    const tempFilePath = await downloadImageToTemp(imageUrl);
    if (tempFilePath) {
        try {
            const mimeType = imageUrl.endsWith('.png') ? 'image/png' : 'image/jpeg';
            const title = tempFilePath.split('/').pop() || 'image';
            
            await invoke("plugin:sharesheet|share_file", {
              file: tempFilePath,
              options: {
                mimeType,
                title,
              },
            });
        } catch (error) {
            console.error('Failed to share image:', error);
            await sendNotification({
                title: '分享失败',
                body: `无法分享图片: ${String(error)}`
            });
        }
    }
}

export async function downloadImage(imageUrl: string): Promise<void> {
    try {
        const response = await fetch(imageUrl, { method: 'GET' });

        if (!response.ok) {
            throw new Error(`Failed to download image: ${response.status}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const saveData = new Uint8Array(arrayBuffer);
        
        let saveDir = await getSetting<string>('download_path');
        if (!saveDir) {
            saveDir = await downloadDir();
        }

        if (!await exists(saveDir)) {
            await mkdir(saveDir, { recursive: true });
        }

        const fileName = new URL(imageUrl).pathname.split('/').pop()?.replace(/[<>:"/\\|?*]/g, '_') || `image-${Date.now()}.jpg`;
        const filePath = await join(saveDir, fileName);

        await writeFile(filePath, saveData);

        await sendNotification({
            title: '下载完成',
            body: `${fileName} 已保存。`
        });

    } catch (error) {
        console.error('Failed to download image:', error);
        await sendNotification({
            title: '下载失败',
            body: `无法下载图片: ${String(error)}`
        });
    }
}
