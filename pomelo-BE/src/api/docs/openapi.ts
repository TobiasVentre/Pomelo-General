export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "Pomelo BE API",
    version: "0.2.0",
    description: "API para colecciones y productos de Pomelo ecommerce."
  },
  servers: [{ url: "http://localhost:4000" }],
  tags: [
    { name: "Health" },
    { name: "Collections" },
    { name: "Products" },
    { name: "Shipping" }
  ],
  paths: {
    "/api/health": {
      get: {
        tags: ["Health"],
        summary: "Health check",
        responses: {
          200: {
            description: "Servicio activo",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: { status: { type: "string", example: "ok" } }
                }
              }
            }
          }
        }
      }
    },
    "/api/collections": {
      get: {
        tags: ["Collections"],
        summary: "Listar colecciones",
        parameters: [
          {
            in: "query",
            name: "activeOnly",
            schema: { type: "boolean" },
            required: false
          }
        ],
        responses: {
          200: {
            description: "Colecciones",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Collection" }
                    },
                    total: { type: "integer" }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Collections"],
        summary: "Crear coleccion",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCollectionRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Coleccion creada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Collection" }
              }
            }
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      }
    },
    "/api/collections/{idOrSlug}": {
      get: {
        tags: ["Collections"],
        summary: "Obtener coleccion por slug",
        parameters: [
          {
            in: "path",
            name: "idOrSlug",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: {
            description: "Coleccion encontrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Collection" }
              }
            }
          },
          404: {
            description: "No encontrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      },
      put: {
        tags: ["Collections"],
        summary: "Actualizar coleccion por id",
        parameters: [
          {
            in: "path",
            name: "idOrSlug",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateCollectionRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Coleccion actualizada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Collection" }
              }
            }
          },
          404: {
            description: "No encontrada",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      }
    },
    "/api/products": {
      get: {
        tags: ["Products"],
        summary: "Listar productos",
        parameters: [
          { in: "query", name: "collection", schema: { type: "string" } },
          { in: "query", name: "category", schema: { type: "string" } },
          { in: "query", name: "activeOnly", schema: { type: "boolean" } },
          { in: "query", name: "page", schema: { type: "integer", minimum: 1 } },
          {
            in: "query",
            name: "pageSize",
            schema: { type: "integer", minimum: 1 }
          }
        ],
        responses: {
          200: {
            description: "Listado",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    items: {
                      type: "array",
                      items: { $ref: "#/components/schemas/Product" }
                    },
                    total: { type: "integer" }
                  }
                }
              }
            }
          }
        }
      },
      post: {
        tags: ["Products"],
        summary: "Crear producto",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateProductRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Producto creado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" }
              }
            }
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      }
    },
    "/api/products/{idOrSlug}": {
      get: {
        tags: ["Products"],
        summary: "Obtener producto por slug",
        parameters: [
          {
            in: "path",
            name: "idOrSlug",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: {
            description: "Producto encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" }
              }
            }
          },
          404: {
            description: "No encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      },
      put: {
        tags: ["Products"],
        summary: "Actualizar producto por id",
        parameters: [
          {
            in: "path",
            name: "idOrSlug",
            required: true,
            schema: { type: "string", format: "uuid" }
          }
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateProductRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Producto actualizado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Product" }
              }
            }
          },
          404: {
            description: "No encontrado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      }
    },
    "/api/shipping/quote": {
      post: {
        tags: ["Shipping"],
        summary: "Cotizar envio",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/ShippingQuoteRequest" }
            }
          }
        },
        responses: {
          200: {
            description: "Cotizacion",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ShippingQuoteResponse" }
              }
            }
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      }
    },
    "/api/shipping/shipments": {
      post: {
        tags: ["Shipping"],
        summary: "Crear envio en OCA",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/CreateShipmentRequest" }
            }
          }
        },
        responses: {
          201: {
            description: "Envio creado",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateShipmentResponse" }
              }
            }
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      }
    },
    "/api/shipping/shipments/{shipmentId}/track": {
      get: {
        tags: ["Shipping"],
        summary: "Tracking de envio",
        parameters: [
          {
            in: "path",
            name: "shipmentId",
            required: true,
            schema: { type: "string" }
          }
        ],
        responses: {
          200: {
            description: "Tracking",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TrackShipmentResponse" }
              }
            }
          },
          400: {
            description: "Validation error",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApiError" }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      ProductColor: {
        type: "object",
        required: ["name", "hex"],
        properties: {
          name: { type: "string" },
          hex: { type: "string" }
        }
      },
      ProductVariant: {
        type: "object",
        required: ["fabricColor", "printColor", "images"],
        properties: {
          fabricColor: { $ref: "#/components/schemas/ProductColor" },
          printColor: { $ref: "#/components/schemas/ProductColor" },
          images: { type: "array", items: { type: "string" } }
        }
      },
      Collection: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          slug: { type: "string" },
          name: { type: "string" },
          colorHex: { type: "string" },
          coverImageUrl: { type: "string" },
          description: { type: "string" },
          isActive: { type: "boolean" },
          displayOrder: { type: "integer" }
        }
      },
      Product: {
        type: "object",
        properties: {
          id: { type: "string", format: "uuid" },
          slug: { type: "string" },
          sku: { type: "string" },
          name: { type: "string" },
          category: { type: "string" },
          collection: { type: "string" },
          priceArs: { type: "number" },
          description: { type: "string" },
          subtitle: { type: "string" },
          rating: { type: "number" },
          shippingInfo: { type: "string" },
          fabricCare: { type: "string" },
          isActive: { type: "boolean" },
          variants: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductVariant" }
          },
          availableSizes: { type: "array", items: { type: "string" } }
        }
      },
      CreateCollectionRequest: {
        type: "object",
        required: [
          "slug",
          "name",
          "colorHex",
          "coverImageUrl",
          "description",
          "isActive",
          "displayOrder"
        ],
        properties: {
          slug: { type: "string" },
          name: { type: "string" },
          colorHex: { type: "string" },
          coverImageUrl: { type: "string" },
          description: { type: "string" },
          isActive: { type: "boolean" },
          displayOrder: { type: "number" }
        }
      },
      CreateProductRequest: {
        type: "object",
        required: [
          "slug",
          "sku",
          "name",
          "category",
          "collection",
          "priceArs",
          "description",
          "subtitle",
          "rating",
          "shippingInfo",
          "fabricCare",
          "isActive",
          "variants"
        ],
        properties: {
          slug: { type: "string" },
          sku: { type: "string" },
          name: { type: "string" },
          category: { type: "string" },
          collection: { type: "string" },
          priceArs: { type: "number" },
          description: { type: "string" },
          subtitle: { type: "string" },
          rating: { type: "number" },
          shippingInfo: { type: "string" },
          fabricCare: { type: "string" },
          isActive: { type: "boolean" },
          variants: {
            type: "array",
            items: { $ref: "#/components/schemas/ProductVariant" }
          },
          availableSizes: { type: "array", items: { type: "string" } }
        }
      },
      ShippingQuoteRequest: {
        type: "object",
        required: ["postalCode", "itemsCount", "subtotalArs"],
        properties: {
          postalCode: { type: "string", example: "1414" },
          itemsCount: { type: "integer", minimum: 1, example: 2 },
          subtotalArs: { type: "number", minimum: 0, example: 84000 }
        }
      },
      ShippingQuoteResponse: {
        type: "object",
        properties: {
          provider: { type: "string", example: "oca" },
          serviceCode: { type: "string" },
          serviceName: { type: "string" },
          estimatedDaysMin: { type: "integer" },
          estimatedDaysMax: { type: "integer" },
          priceArs: { type: "number" },
          currency: { type: "string", example: "ARS" },
          notes: { type: "string" }
        }
      },
      CreateShipmentRequest: {
        type: "object",
        required: [
          "orderId",
          "recipientName",
          "recipientEmail",
          "recipientPhone",
          "recipientAddress",
          "recipientCity",
          "recipientProvince",
          "recipientPostalCode",
          "packageWeightKg",
          "packageVolumeCm3",
          "declaredValueArs",
          "itemsDescription"
        ],
        properties: {
          orderId: { type: "string", example: "ORDER-1001" },
          productCode: { type: "string", example: "OCA_TEST" },
          recipientName: { type: "string", example: "Maria Gomez" },
          recipientEmail: { type: "string", example: "maria@example.com" },
          recipientPhone: { type: "string", example: "+5491155551111" },
          recipientAddress: { type: "string", example: "Av. Santa Fe 1234" },
          recipientCity: { type: "string", example: "CABA" },
          recipientProvince: { type: "string", example: "Buenos Aires" },
          recipientPostalCode: { type: "string", example: "1414" },
          packageWeightKg: { type: "number", example: 0.7 },
          packageVolumeCm3: { type: "number", example: 3200 },
          declaredValueArs: { type: "number", example: 42000 },
          itemsDescription: { type: "string", example: "Remera Rib de algodon x1" }
        }
      },
      CreateShipmentResponse: {
        type: "object",
        properties: {
          provider: { type: "string", example: "oca" },
          shipmentId: { type: "string" },
          labelUrl: { type: "string" },
          raw: { type: "object", additionalProperties: true }
        }
      },
      TrackShipmentResponse: {
        type: "object",
        properties: {
          provider: { type: "string", example: "oca" },
          shipmentId: { type: "string" },
          currentStatus: { type: "string" },
          history: {
            type: "array",
            items: {
              type: "object",
              properties: {
                date: { type: "string", nullable: true },
                status: { type: "string" },
                detail: { type: "string" }
              }
            }
          },
          raw: { type: "object", additionalProperties: true }
        }
      },
      ApiError: {
        type: "object",
        properties: {
          code: { type: "string" },
          message: { type: "string" },
          details: { type: "array", items: { type: "string" } }
        }
      }
    }
  }
} as const;
