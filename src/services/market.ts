import { fetch } from '@tauri-apps/plugin-http';
import { getSetting } from './settings';
import { writeFile, mkdir, exists } from '@tauri-apps/plugin-fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { APICORE_SCHEMA } from './schema';
import { sendNotification } from '@tauri-apps/plugin-notification';
import { downloadDir, join, tempDir } from '@tauri-apps/api/path';
import { invoke } from '@tauri-apps/api/core';

function parseDirectoryListing(html: string): { name: string, type: 'dir' | 'file' }[] {
    const items = [];
    const regex = /<a href=.*? class="([^"]+)".*?>(.+?)<\/a>/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
        const classList = match[1];
        const name = match[2];
        if (classList.includes('folder')) {
            items.push({ name, type: 'dir' as const });
        } else if (classList.includes('file')) {
            items.push({ name, type: 'file' as const });
        }
    }
    return items;
}

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
  const useStaticSetting = await getSetting<boolean>('use_static_index');
  const useStatic = useStaticSetting === null ? true : useStaticSetting;

  if (useStatic) {
    try {
      const staticApiUrl = await getSetting<string>('static_api_url') || 'https://acgapi.sr-studio.cn/';
      const response = await fetch(staticApiUrl);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const html = await response.text();
      const items = parseDirectoryListing(html);
      return items.filter(item => item.type === 'dir' && !item.name.startsWith('.')).map(item => item.name);
    } catch (error) {
      console.error('Error fetching API categories from static index:', error);
      return [];
    }
  }

  try {
    const pat = await getSetting<string>('github_pat');
    const githubApiUrl = await getSetting<string>('github_api_url') || 'https://api.github.com/repos/IntelliMarkets/Wallpaper_API_Index/contents/';
    const data = await fetchJson<any[]>(githubApiUrl, pat || undefined);
    return data.filter(item => item.type === 'dir').map(item => item.name);
  } catch (error) {
    console.error('Error fetching API categories:', error);
    return [];
  }
}

const ajv = new Ajv({ allErrors: true });
addFormats(ajv);
const validate = ajv.compile(APICORE_SCHEMA);

export async function getApisByCategory(category: string): Promise<ApiSource[]> {
  const useStaticSetting = await getSetting<boolean>('use_static_index');
  const useStatic = useStaticSetting === null ? true : useStaticSetting;

  if (useStatic) {
    try {
      const staticApiUrl = await getSetting<string>('static_api_url') || 'https://acgapi.sr-studio.cn/';
      const categoryUrl = `${staticApiUrl}${encodeURIComponent(category)}/`;
      const response = await fetch(categoryUrl);
      if (!response.ok) throw new Error(`Request failed: ${response.status}`);
      const html = await response.text();
      const items = parseDirectoryListing(html);

      const apiPromises = items
        .filter(item => item.type === 'file' && item.name.endsWith('.api.json'))
        .map(async (item: any) => {
          try {
            const apiName = item.name.replace('.api.json', '');
            const fileUrl = `${categoryUrl}${encodeURIComponent(item.name)}`;
            const contentResponse = await fetch(fileUrl);
            if (!contentResponse.ok) throw new Error(`Failed to fetch ${fileUrl}`);
            const content = await contentResponse.json();
            
            if (validate(content)) {
              return { name: apiName, content, category };
            } else {
              console.error(`Invalid API config for ${item.name}:`, validate.errors);
              return null;
            }
          } catch (e) {
            console.error(`Error processing file ${item.name}:`, e);
            return null;
          }
        });
      
      const results = await Promise.all(apiPromises);
      return results.filter((item): item is ApiSource => item !== null);

    } catch (error) {
      console.error(`Error fetching APIs for category ${category} from static index:`, error);
      return [];
    }
  }

  try {
    const pat = await getSetting<string>('github_pat');
    const githubApiUrl = await getSetting<string>('github_api_url') || 'https://api.github.com/repos/IntelliMarkets/Wallpaper_API_Index/contents/';
    const files = await fetchJson<any[]>(`${githubApiUrl}${category}`, pat || undefined);
    
    const apiPromises = files
      .filter(file => file.name.endsWith('.api.json'))
      .map(async (file: any) => {
        try {
          const apiName = file.name.replace('.api.json', '');
          const content = await fetchJson<any>(file.download_url, pat || undefined);
          
          // Validate the content against the schema
          if (validate(content)) {
            return { name: apiName, content, category };
          } else {
            console.error(`Invalid API config for ${file.name}:`, validate.errors);
            return null;
          }
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

function constructApiUrl(api: string, formState: Record<number, any>, apiConfig: ApiSource): string {
    let url = api.replace(/\/$/, '').replace(/\?$/, '');
    const pathParams: string[] = [];
    const queryParams: Record<string, string> = {};

    // This logic mirrors the Python construct_api function
    apiConfig.content.parameters.forEach((param: any, index: number) => {
        const key = param.name;
        const value = formState[index];

        if (value === undefined || value === null) {
            return; // continue
        }

        // Path parameter if name is null, undefined, or an empty string
        if (key === null || typeof key === 'undefined' || key === '') {
            pathParams.push(String(value));
        } else { // Query parameter
            const split_str = param.split_str || '|';
            if (Array.isArray(value)) {
                queryParams[key] = value.join(split_str);
            } else {
                queryParams[key] = String(value);
            }
        }
    });

    if (pathParams.length > 0) {
        url += '/' + pathParams.join('/');
    }

    if (Object.keys(queryParams).length > 0) {
        const queryString = new URLSearchParams(queryParams).toString();
        url += '?' + queryString;
    }

    return url;
}

function parseResponse(data: any, path: string): any {
    const indexPattern = /\[(.*?)\]/g;

    function resolvePath(obj: any, parts: string[]): any {
        if (parts.length === 0 || obj === null || typeof obj === 'undefined') {
            return obj;
        }

        const currentPart = parts[0];
        const remainingParts = parts.slice(1);
        const matches = [...currentPart.matchAll(indexPattern)];

        if (matches.length > 0) {
            const field = currentPart.substring(0, matches[0].index).trim();
            let targetObj = obj;

            if (field) {
                if (typeof targetObj === 'object' && targetObj !== null && field in targetObj) {
                    targetObj = targetObj[field];
                } else {
                    return null;
                }
            }

            for (const match of matches) {
                if (targetObj === null || typeof targetObj === 'undefined') return null;
                const indexExpr = match[1];

                if (indexExpr === '*') {
                    if (!Array.isArray(targetObj)) return null;
                    // If there are more parts, recurse, otherwise return the items
                    return targetObj.map(item => resolvePath(item, remainingParts));
                } else if (indexExpr.includes(':')) {
                    if (!Array.isArray(targetObj)) return null;
                    let [startStr, endStr, stepStr] = indexExpr.split(':');
                    let start = startStr ? parseInt(startStr, 10) : 0;
                    let end = endStr ? parseInt(endStr, 10) : targetObj.length;
                    let step = stepStr ? parseInt(stepStr, 10) : 1;

                    if (start < 0) start += targetObj.length;
                    if (end < 0) end += targetObj.length;

                    const sliced = [];
                    for (let i = start; i < end; i += step) {
                        if (targetObj[i] !== undefined) {
                            sliced.push(targetObj[i]);
                        }
                    }
                    targetObj = sliced;
                } else {
                    try {
                        let idx = parseInt(indexExpr, 10);
                        if (!Array.isArray(targetObj)) return null;
                        if (idx < 0) idx += targetObj.length;

                        if (idx >= 0 && idx < targetObj.length) {
                            targetObj = targetObj[idx];
                        } else {
                            return null;
                        }
                    } catch {
                        return null;
                    }
                }
            }
            return resolvePath(targetObj, remainingParts);
        }

        if (currentPart.includes('.')) {
            const subParts = currentPart.split('.').concat(remainingParts);
            return resolvePath(obj, subParts);
        }

        if (typeof obj === 'object' && obj !== null && currentPart in obj) {
            return resolvePath(obj[currentPart], remainingParts);
        }

        if (Array.isArray(obj) && /^\d+$/.test(currentPart)) {
            try {
                const idx = parseInt(currentPart, 10);
                if (idx >= 0 && idx < obj.length) {
                    return resolvePath(obj[idx], remainingParts);
                }
            } catch {
                return null;
            }
        }

        return null;
    }

    const pathParts = path.split('.').filter(p => p.trim());
    const result = resolvePath(data, pathParts);
    
    // Flatten the result if it's an array of arrays from wildcards
    return Array.isArray(result) ? result.flat(Infinity) : result;
}


export async function generateImages(apiConfig: ApiSource, formState: Record<number, any>): Promise<string[]> {
    console.log("Generating images with config:", apiConfig);
    console.log("Payload (formState by index):", formState);

    const { link, func, response: responseConfig, parameters } = apiConfig.content;
    const imageConfig = responseConfig.image;
    const method = func.toUpperCase();
    let finalUrl = link;

    const options: any = { method };

    if (method === 'GET' || method === 'HEAD') {
        finalUrl = constructApiUrl(link, formState, apiConfig);
    } else {
        // For POST requests, construct a name-keyed payload
        const payload: Record<string, any> = {};
        parameters.forEach((param: any, index: number) => {
            if (param.name) {
                payload[param.name] = formState[index];
            }
        });
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

        let imageUrls: any[] = [];
        const responseData = new Uint8Array(await response.arrayBuffer());

        switch (imageConfig.content_type) {
            case 'BINARY':
                const blob = new Blob([responseData]);
                imageUrls = [URL.createObjectURL(blob)];
                break;

            case 'BASE64':
            case 'URL':
            default:
                // For URL and BASE64, we need the text content
                const textData = new TextDecoder().decode(responseData);
                console.log("Received response data:", textData);

                if (imageConfig.content_type === 'BASE64') {
                    const path = imageConfig.path || '';
                    const base64Data = path ? parseResponse(JSON.parse(textData), path) : textData;
                    if (Array.isArray(base64Data)) {
                        imageUrls = base64Data.map(b64 => `data:image/png;base64,${b64}`);
                    } else {
                        imageUrls = [`data:image/png;base64,${base64Data}`];
                    }
                    break;
                }

                // Default to URL content type
                try {
                    const data = JSON.parse(textData);
                    const path = imageConfig.path || '';
                    if (path) {
                        const extractedUrls = parseResponse(data, path);
                        if (extractedUrls) {
                            imageUrls = Array.isArray(extractedUrls) ? extractedUrls : [extractedUrls];
                        }
                    } else {
                        imageUrls = Array.isArray(data) ? data : [data];
                    }
                } catch (e) {
                    imageUrls = textData.split('\n').filter(url => url.trim().startsWith('http'));
                }
                break;
        }

        return imageUrls.filter(Boolean).map(String);

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
        
        const saveDir = await downloadDir();

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
