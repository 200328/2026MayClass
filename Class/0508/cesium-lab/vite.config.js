import { defineConfig } from 'vite';
import cesium from 'vite-plugin-cesium';

// vite-plugin-cesium:
// Cesium은 정적 에셋(Workers, Assets, Widgets)이 많아서 Vite에서 수동 설정이 복잡함.
// 이 플러그인이 자동으로 처리해줌 → 설정 끝!
export default defineConfig({
  plugins: [cesium()],
  server: {
    port: 3000,
    open: true,
  },
});
