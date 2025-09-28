/**
 * API設定ユーティリティ
 */

/**
 * 環境に応じたバックエンドのベースURLを取得
 */
export const getBackendUrl = (): string => {
  // 1. 環境変数からバックエンドURLを取得
  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  
  if (backendUrl && backendUrl !== 'https://placeholder-backend-url') {
    return backendUrl;
  }
  
  // 2. 本番環境でHTMLに埋め込まれた設定を確認
  if (typeof window !== 'undefined') {
    const metaBackendUrl = document.querySelector('meta[name="backend-url"]')?.getAttribute('content');
    if (metaBackendUrl && metaBackendUrl !== 'https://placeholder-backend-url') {
      return metaBackendUrl;
    }
    
    // 3. window.envオブジェクトからの取得（nginx環境変数注入）
    const windowEnv = (window as any).env;
    if (windowEnv?.REACT_APP_BACKEND_URL && windowEnv.REACT_APP_BACKEND_URL !== 'https://placeholder-backend-url') {
      return windowEnv.REACT_APP_BACKEND_URL;
    }
  }
  
  // 4. 開発環境でのデフォルトURL
  return 'http://localhost:3001';
};

/**
 * APIエンドポイントのフルURLを生成
 * @param path APIパス（例: '/api/surveys/events'）
 */
export const getApiUrl = (path: string): string => {
  const baseUrl = getBackendUrl();
  // パスが/で始まる場合はそのまま、そうでなければ/を追加
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

/**
 * 相対パスでのAPIリクエスト用ベースURL
 * プロキシが設定されている場合は空文字を返す
 */
export const getRelativeApiBase = (): string => {
  // 本番環境では直接バックエンドにアクセス
  if (process.env.NODE_ENV === 'production') {
    return getBackendUrl();
  }
  
  // 開発環境ではプロキシまたは直接アクセス
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:3001';
};