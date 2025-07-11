# Cross-Platform React Development Guide (Windows + Linux with VMware HGFS)

This guide explains how to successfully develop React applications across Windows and Linux using VMware's Host-Guest File System (HGFS).

## The Challenge

When developing on both Windows and Linux using VMware shared folders (HGFS), you'll encounter several issues:

1. **Symlinks not supported**: HGFS doesn't support symbolic links, which npm uses for executable binaries
2. **Permission conflicts**: Files created on Windows may have different permissions in Linux
3. **Line ending differences**: Windows uses CRLF, Linux uses LF
4. **Platform-specific dependencies**: Some npm packages compile native binaries for specific platforms

## Solution Overview

### 1. Initial Setup

#### Create a `.npmrc` file in your project root:
```
bin-links=false
```

This prevents npm from creating symlinks automatically.

#### Install dependencies without symlinks:
```bash
npm install --no-bin-links
```

### 2. Configure Vite for Network Access

Update `vite.config.js` to listen on all network interfaces:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',    // Listen on all interfaces
    port: 5173,
    strictPort: true,
    open: false
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
```

### 3. Update package.json Scripts

Since symlinks don't work, update your scripts to use node directly:

```json
{
  "scripts": {
    "dev": "node node_modules/vite/bin/vite.js",
    "build": "node node_modules/vite/bin/vite.js build",
    "preview": "node node_modules/vite/bin/vite.js preview",
    "lint": "node node_modules/eslint/bin/eslint.js . --ext js,jsx --report-unused-disable-directives --max-warnings 0"
  }
}
```

### 4. Git Configuration

Configure Git to handle line endings properly:

```bash
# In your project directory
git config core.autocrlf input
```

Or create a `.gitattributes` file:
```
* text=auto
*.js text eol=lf
*.jsx text eol=lf
*.json text eol=lf
*.md text eol=lf
```

### 5. Development Workflow

#### On Linux:
1. Navigate to the shared folder: `cd /mnt/hgfs/YourProject`
2. Install dependencies: `npm install --no-bin-links`
3. Start dev server: `npm run dev`
4. Access via: `http://localhost:5173` or `http://[VM-IP]:5173`

#### On Windows:
1. Open the project in your preferred editor
2. Edit files normally - changes sync automatically
3. Access the dev server at: `http://[VM-IP]:5173`

### 6. Troubleshooting

#### Issue: "vite: command not found"
**Solution**: Use `npx vite` or `node node_modules/vite/bin/vite.js`

#### Issue: Permission errors during npm install
**Solution**: 
- Delete `node_modules` and reinstall with `--no-bin-links`
- Or copy project to a native Linux directory for package management

#### Issue: Can't connect to dev server from Windows
**Solution**:
1. Ensure VM network is in Bridged or NAT mode
2. Check Linux firewall: `sudo iptables -L`
3. Verify server is listening: `ss -tlnp | grep 5173`
4. Try SSH tunnel: `ssh -L 5173:localhost:5173 user@vm-ip`

#### Issue: Import aliases not working
**Solution**: Ensure vite.config.js includes the resolve.alias configuration

### 7. Best Practices

1. **Separate node_modules**: Consider maintaining separate node_modules for each platform by:
   - Adding `node_modules/` to `.gitignore`
   - Running `npm install` separately on each platform

2. **Use CI/CD**: Set up GitHub Actions or similar to test builds on both platforms

3. **Docker Alternative**: Consider using Docker for a more consistent development environment

4. **Native Development**: For better performance, consider:
   - Developing in native directories
   - Using rsync or git to sync changes
   - Using WSL2 instead of VMware for Windows/Linux development

### 8. Alternative: WSL2 (Recommended)

If possible, consider using WSL2 instead of VMware for better integration:
- Native filesystem performance
- Better symlink support
- Seamless Windows/Linux integration
- Built-in VS Code support

### Quick Reference Commands

```bash
# First time setup
echo "bin-links=false" > .npmrc
npm install --no-bin-links

# Daily development
npm run dev                           # Start dev server
node node_modules/vite/bin/vite.js   # Direct vite command

# Useful checks
ss -tlnp | grep 5173                 # Check if server is listening
ip addr show | grep inet             # Find VM IP address
```

## Summary

The key to successful cross-platform development with VMware HGFS is:
1. Disable npm symlinks
2. Configure network access properly
3. Use direct node execution for scripts
4. Handle line endings consistently

With these configurations, you can seamlessly develop React applications on both Windows and Linux using the same codebase.