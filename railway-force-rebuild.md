# Railway Force Rebuild

Để sửa lỗi "react-scripts: command not found" trên Railway:

## Cách 1: Xóa cache và rebuild
1. Vào Railway Dashboard
2. Vào service Frontend
3. Click "Settings" 
4. Scroll xuống "Danger Zone"
5. Click "Clear Build Cache"
6. Click "Redeploy"

## Cách 2: Sử dụng nixpkgs.json
Railway sẽ tự động detect và rebuild với cấu hình mới.

## Cách 3: Update buildCommand
Đã update trong railway.toml:
```toml
buildCommand = "npm ci && npx react-scripts build"
```

## Nguyên nhân:
- Railway cache old build configuration
- Node modules not properly installed
- PATH not including node_modules/.bin

## Giải pháp:
- Force clear cache
- Rebuild with new configuration
- Use npx to ensure correct path

Last updated: 2025-10-13

