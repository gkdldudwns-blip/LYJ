import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // 하위 경로(GitHub Pages 등)에 올려도 동작하도록 상대 경로로 빌드
      base: './',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        // 선택 사항: .env.local의 키를 기본값으로 쓴다. 공개 배포할 때는 넣지 말 것 (빌드 결과에 키가 그대로 들어감)
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY ?? '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
