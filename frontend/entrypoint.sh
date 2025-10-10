#!/bin/sh

# 環境変数の設定
echo "Starting frontend with environment variables:"
echo "REACT_APP_BACKEND_URL: ${REACT_APP_BACKEND_URL:-undefined}"

# index.htmlの環境変数プレースホルダを実際の値に置換
if [ -n "${REACT_APP_BACKEND_URL}" ] && [ "${REACT_APP_BACKEND_URL}" != "https://placeholder-backend-url" ]; then
    echo "Injecting backend URL: ${REACT_APP_BACKEND_URL}"
    sed -i "s|__BACKEND_URL__|${REACT_APP_BACKEND_URL}|g" /usr/share/nginx/html/index.html
else
    echo "WARNING: REACT_APP_BACKEND_URL not set or is placeholder. Using development backend URL."
    echo "In production, this should be set to the actual backend URL."
    sed -i "s|__BACKEND_URL__|http://localhost:3001|g" /usr/share/nginx/html/index.html
fi

# nginxを起動
echo "Starting nginx..."
nginx -g "daemon off;"