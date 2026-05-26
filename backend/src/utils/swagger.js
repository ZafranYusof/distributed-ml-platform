import swaggerJsdoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'DistML - Distributed ML Training Platform API',
      version: '1.0.0',
      description: 'API documentation for the Distributed ML Training Platform',
    },
    servers: [
      { url: 'http://localhost:5005', description: 'Development server' }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./src/routes/*.js', './src/index.js']
};

export const swaggerSpec = swaggerJsdoc(options);
