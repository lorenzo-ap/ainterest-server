## Overview

This repository is a lightweight backend application designed to support image generation, likely interfacing with an AI-based service.  
Created by [**lorenzo-ap**](https://github.com/lorenzo-ap), it provides API endpoints for [**ainterest-fe**](https://github.com/lorenzo-ap/ainterest-fe).

## Features

- **API Endpoints**: Handles prompt-based image generation requests.
- **AI Integration**: Connects to an external AI service for image creation.
- **Simple Structure**: Minimalist backend for efficient processing.

## Prerequisites

- **Node.js**: Version 14.x or higher.
- **npm**: For dependency management.
- **.env setup**: See `.env.example` as an example.

## Configuration with .env

Create a `.env` file in the root directory with required variables, e.g.:

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDFLARE_ACCOUNT_ID=your-cloudflare-account-id
CLOUDFLARE_API_TOKEN=your-cloudflare-api-token
MONGODB_URL=your-mongodb-url
JWT_ACCESS_SECRET=random-string
JWT_REFRESH_SECRET=different-random-string
FRONTEND_URL=your-frontend-url
IMAGE_GENERATOR_NUM_STEPS=0-to-20
RAPIDAPI_KEY=your-rapidapi-key
```

## Author

Created by **lorenzo-ap**.

## Last Updated

October 17, 2025
