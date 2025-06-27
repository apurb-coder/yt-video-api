#!/bin/bash

echo "🔍 Checking for Python..."
if ! command -v python3 &> /dev/null; then
  echo "❌ Python not found. Installing..."
  if [ "$(uname)" == "Darwin" ]; then
    # macOS
    brew install python
  elif [ -f /etc/debian_version ]; then
    # Debian/Ubuntu
    sudo apt update
    sudo apt install -y python3 python3-pip
  elif [ -f /etc/redhat-release ]; then
    # RHEL/CentOS
    sudo yum install -y python3 python3-pip
  fi
else
  echo "✅ Python is already installed"
fi

echo "🔍 Checking for yt-dlp..."
if ! command -v yt-dlp &> /dev/null; then
  echo "📦 Installing yt-dlp with pip..."
  python3 -m pip install --upgrade yt-dlp
else
  echo "✅ yt-dlp is already installed"
fi

echo "📁 Installing Node.js dependencies with yarn..."
yarn install

echo "🚀 Deployment complete!"
