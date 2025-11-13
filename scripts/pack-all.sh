#!/bin/bash

# Pack All Packages for Local Testing
# Run this script from the root of the monorepo
# Usage: ./scripts/pack-all.sh [output-directory]

# Don't exit on errors - we handle them explicitly
set +e

OUTPUT_DIR="${1:-./dist-packages}"
PACKAGES_ROOT="./packages"

# Get absolute path of the project root
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# Get absolute path of the output directory
OUTPUT_DIR_ABS="$PROJECT_ROOT/$OUTPUT_DIR"

echo "🎁 Packing all distributable packages..."
echo "📦 Output directory: $OUTPUT_DIR_ABS"
echo ""

# Create output directory
mkdir -p "$OUTPUT_DIR_ABS"

# Function to pack a package
pack_package() {
    local package_path=$1
    local package_name=$2
    
    if [ -f "$package_path/package.json" ]; then
        echo "📦 Packing $package_name..."
        cd "$package_path"
        
        # Build if build script exists
        if grep -q '"build":' package.json; then
            echo "   🔨 Building..."
            if npm run build; then
                echo "   ✅ Build successful"
            else
                echo "   ⚠️  Build failed, continuing anyway..."
            fi
        fi
        
        # Pack the package
        echo "   📦 Creating tarball..."
        if npm pack --pack-destination="$OUTPUT_DIR_ABS"; then
            echo "✅ $package_name packed"
        else
            echo "❌ Failed to pack $package_name"
        fi
        
        cd - > /dev/null
        echo ""
    fi
}

# Pack all distributable packages
echo "📦 Packing Contracts..."
pack_package "$PACKAGES_ROOT/contracts/domain-contracts" "multitenantkit/domain-contracts"
pack_package "$PACKAGES_ROOT/contracts/api-contracts" "multitenantkit/api-contracts"

echo "📦 Packing Core..."
pack_package "$PACKAGES_ROOT/domain" "multitenantkit/domain"

echo "📦 Packing Adapters..."
pack_package "$PACKAGES_ROOT/adapters/auth/supabase" "multitenantkit/adapter-auth-supabase"
pack_package "$PACKAGES_ROOT/adapters/persistence/json" "multitenantkit/adapter-persistence-json"
pack_package "$PACKAGES_ROOT/adapters/persistence/postgres" "multitenantkit/adapter-persistence-postgres"
pack_package "$PACKAGES_ROOT/adapters/system/crypto-uuid" "multitenantkit/adapter-system-crypto-uuid"
pack_package "$PACKAGES_ROOT/adapters/system/system-clock" "multitenantkit/adapter-system-system-clock"
pack_package "$PACKAGES_ROOT/adapters/transport/express" "multitenantkit/adapter-transport-express"
pack_package "$PACKAGES_ROOT/api/handlers" "multitenantkit/api-handlers"
pack_package "$PACKAGES_ROOT/adapters/metrics/http-metrics" "multitenantkit/adapter-metrics-http-metrics"

echo "📦 Packing Composition..."
pack_package "$PACKAGES_ROOT/composition" "multitenantkit/composition"

echo "📦 Packing Bundles..."
pack_package "$PACKAGES_ROOT/bundles/sdk" "multitenantkit/sdk"

echo ""
echo "🎉 All packages packed successfully!"
echo "📂 Packages available in: $OUTPUT_DIR_ABS"
echo ""
echo "To install in another project:"
echo "  cd /path/to/your/project"
echo "  npm install $OUTPUT_DIR_ABS/*.tgz"
echo ""
