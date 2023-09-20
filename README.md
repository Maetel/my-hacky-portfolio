# SDK bundling example

### Description
* SDK template for CSR using React + TypeScript

### Usage
```shell
npm i

# dev runs at http://localhost:8040 using 'esbuild --watch' and 'serve'
npm run dev

# build path : /build/my-sdk.$SDK_VERSION.js
# SDK_VERSION is defined in scripts/VERSION.js
# copied to :
#   - /build/my-sdk.latest.min.js
#   - /public/my-sdk.$SDK_VERSION.js
#   - /public/my-sdk.latest.min.js
npm run build
```

### Main entry points
```shell
# 1. import "my-sdk.js" and new MySDK()
public/index.html

# 2. Definition of class MySDK
scripts/sdk.tsx

# 3. React <App/> rendered in MySDK.render() 
components/App.tsx

# 4. Version of SDK and distribution file
scripts/VERSION.js
```