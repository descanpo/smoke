// @react-native/assets-registry/registry'nin Flow'suz web shim'i.
// Orijinal dosya `export type` (Flow) içerdiği için esbuild/vite altında
// ayrıştırılamıyor. API birebir aynı: registerAsset + getAssetByID.
// ESM named export kullanılıyor ki hem ESM (`import { getAssetByID }`) hem de
// CJS importer'lar (rollup interop) çalışsın.

const assets = [];

export function registerAsset(asset) {
  // push yeni uzunluğu döndürür; ilk asset id 1 alır (0 değil) ki truthy olsun.
  return assets.push(asset);
}

export function getAssetByID(assetId) {
  return assets[assetId - 1];
}

export default { registerAsset, getAssetByID };
