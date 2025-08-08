#!/bin/bash

# Test runner for DT Protection Admin Interface
echo "🧪 Running DT Protection Admin Interface Tests"
echo "=============================================="

# Set test environment
export NODE_ENV=test
export TEST_MONGODB_URI=mongodb://localhost:27017/dtprotection-test

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB is not running. Starting MongoDB..."
    # You may need to adjust this path based on your MongoDB installation
    mongod --fork --logpath /dev/null --dbpath /tmp/mongodb-test
fi

# Install test dependencies if needed
if [ ! -d "tests/node_modules" ]; then
    echo "📦 Installing test dependencies..."
    cd tests && npm install && cd ..
fi

# Run backend tests
echo "🔧 Running Backend Tests..."
cd tests
npm run test:run -- admin-auth.test.ts

# Run frontend tests
echo "🎨 Running Frontend Tests..."
npm run test:run -- frontend-admin.test.ts

echo "✅ All tests completed!"
echo "📊 Test coverage and results available in the tests directory"
