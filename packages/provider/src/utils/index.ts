export * from './base-plugin';

export function normalizePhoneNumber(phone: string): string {
  // 한국 휴대폰 번호 정규화
  const cleaned = phone.replace(/[^\d]/g, '');
  
  // 국가코드 제거
  if (cleaned.startsWith('82')) {
    return '0' + cleaned.substring(2);
  }
  
  // 이미 0으로 시작하면 그대로
  if (cleaned.startsWith('0')) {
    return cleaned;
  }
  
  // 10~11자리 숫자면 앞에 0 추가
  if (cleaned.length >= 10 && cleaned.length <= 11) {
    return '0' + cleaned;
  }
  
  return cleaned;
}

export function validatePhoneNumber(phone: string): boolean {
  const normalized = normalizePhoneNumber(phone);
  return /^01[0-9]{8,9}$/.test(normalized);
}

export function formatDateTime(date: Date): string {
  // yyyy-MM-dd HH:mm:ss 형식
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
}

export function parseTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  
  // #{변수명} 형태의 변수 치환
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`#{${key}}`, 'g');
    result = result.replace(regex, value);
  }
  
  // {{변수명}} 형태의 변수도 지원
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value);
  }
  
  return result;
}

export function extractVariables(template: string): string[] {
  const variables = new Set<string>();
  
  // #{변수명} 형태 추출
  const hashMatches = template.match(/#\{([^}]+)\}/g);
  if (hashMatches) {
    hashMatches.forEach(match => {
      const variable = match.slice(2, -1); // #{ 와 } 제거
      variables.add(variable);
    });
  }
  
  // {{변수명}} 형태 추출
  const braceMatches = template.match(/\{\{([^}]+)\}\}/g);
  if (braceMatches) {
    braceMatches.forEach(match => {
      const variable = match.slice(2, -2); // {{ 와 }} 제거
      variables.add(variable);
    });
  }
  
  return Array.from(variables);
}

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function retry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries: number;
    delay: number;
    backoff?: 'linear' | 'exponential';
  }
): Promise<T> {
  return new Promise(async (resolve, reject) => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delayMs = options.backoff === 'exponential' 
            ? options.delay * Math.pow(2, attempt - 1)
            : options.delay * attempt;
          await delay(delayMs);
        }
        
        const result = await fn();
        resolve(result);
        return;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === options.maxRetries) {
          reject(lastError);
          return;
        }
      }
    }
  });
}