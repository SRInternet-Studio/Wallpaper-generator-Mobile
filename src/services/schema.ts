export const APICORE_SCHEMA = {
  "title": "APICORE Configuration Schema",
  "description": "Schema for APICORE API configuration files",
  "type": "object",
  "required": ["friendly_name", "link", "func", "APICORE_version", "parameters", "response"],
  "additionalProperties": false,
  "properties": {
    "friendly_name": {
      "type": "string",
      "description": "API的友好名称，用于界面展示"
    },
    "intro": {
      "type": "string",
      "description": "API的简要介绍和说明"
    },
    "icon": {
      "type": "string",
      "format": "uri",
      "description": "API的图标URL地址"
    },
    "link": {
      "type": "string",
      "format": "uri",
      "description": "API的完整端点URL"
    },
    "func": {
      "type": "string",
      "enum": ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
      "description": "HTTP请求方法"
    },
    "APICORE_version": {
      "type": "string",
      "enum": ["1.0"],
      "description": "APICORE配置版本"
    },
    "parameters": {
      "type": "array",
      "description": "API请求参数配置",
      "items": {
        "type": "object",
        "required": ["type", "value", "friendly_name"],
        "properties": {
          "name": {
            "type": ["string", "null"]
          },
          "type": {
            "type": "string",
            "enum": ["integer", "boolean", "list", "string", "enum"],
            "description": "参数类型"
          },
          "required": {
            "type": "boolean",
            "description": "参数是否为必需项"
          },
          "value": {
            "oneOf": [
              { "type": "string" },
              { "type": "number" },
              { "type": "boolean" },
              { "type": "array" }
            ],
            "description": "参数的默认值"
          },
          "friendly_name": {
            "type": "string",
            "description": "用户界面显示的友好名称"
          },
          "friendly_value": {
            "type": "array",
            "items": { "type": "string" }
          },
          "min_value": {
            "type": ["number", "null"],
            "description": "最小值限制（仅integer类型有效）"
          },
          "max_value": {
            "type": ["number", "null"],
            "description": "最大值限制（仅integer类型有效）"
          },
          "split_str": {
            "type": ["string", "null"],
            "description": "列表类型的分隔符"
          },
          "enable": {
            "type": "boolean"
          }
        }
      }
    },
    "response": {
      "type": "object",
      "description": "API响应解析配置",
      "required": ["image"],
      "properties": {
        "image": {
          "type": "object",
          "required": ["content_type"],
          "properties": {
            "content_type": {
              "type": "string",
              "enum": ["URL", "BINARY", "BASE64"],
              "description": "图像内容类型"
            },
            "path": {
              "type": "string",
              "description": "图像在响应中的路径（点分隔）"
            },
            "is_list": {
              "type": "boolean",
              "description": "是否为图像列表"
            },
            "is_base64": {
              "type": "boolean",
              "description": "二进制是否base64编码"
            }
          }
        },
        "others": {
          "type": "array",
          "description": "其他数据提取配置",
          "items": {
            "type": "object",
            "required": ["friendly_name", "data"],
            "properties": {
              "friendly_name": {
                "type": "string",
                "description": "数据分组名称"
              },
              "data": {
                "type": "array",
                "description": "具体数据项列表",
                "items": {
                  "type": "object",
                  "required": ["friendly_name", "path"],
                  "properties": {
                    "friendly_name": {
                      "type": "string",
                      "description": "数据项友好名称"
                    },
                    "path": {
                      "type": "string",
                      "description": "数据在响应中的路径（点分隔）"
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
};
