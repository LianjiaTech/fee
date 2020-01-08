const ua = {
  "properties": {
    "browser": {
      "properties": {
        "major": {
          "type": "keyword"
        },
        "name": {
          "type": "keyword"
        },
        "version": {
          "type": "keyword"
        }
      }
    },
    "cpu": {
      "properties": {
        "architecture": {
          "type": "keyword"
        }
      }
    },
    "device": {
      "properties": {
        "model": {
          "type": "keyword"
        },
        "type": {
          "type": "keyword"
        },
        "vendor": {
          "type": "keyword"
        }
      }
    },
    "engine": {
      "properties": {
        "name": {
          "type": "keyword"
        },
        "version": {
          "type": "keyword"
        }
      }
    },
    "os": {
      "properties": {
        "name": {
          "type": "keyword"
        },
        "version": {
          "type": "keyword"
        }
      }
    },
    "ua": {
      "type": "keyword"
    }
  }
}

const detail = {
  "properties": {
    "code": {
      "type": "text",
      "fields": {
        "keyword": {
          "type": "keyword",
          "ignore_above": 256
        }
      }
    },
    "name": {
      "type": "text",
      "fields": {
        "keyword": {
          "type": "keyword",
          "ignore_above": 256
        }
      }
    },
    "error_no": {
      "type": "text",
      "fields": {
        "keyword": {
          "type": "keyword",
          "ignore_above": 256
        }
      }
    },
    "url": {
      "type": "keyword"
    },
    "http_code": {
      "type": "long"
    },
    "during_ms": {
      "type": "long"
    },
    "duration_ms": {
      "type": "long"
    },
    "request_size_b": {
      "type": "long"
    },
    "response_size_b": {
      "type": "long"
    },
    "unloadEventStart": {
      "type": "long"
    },
    "navigationStart": {
      "type": "long"
    },
    "unloadEventEnd": {
      "type": "long"
    },
    "redirectStart": {
      "type": "long"
    },
    "redirectEnd": {
      "type": "long"
    },
    "fetchStart": {
      "type": "long"
    },
    "domainLookupStart": {
      "type": "long"
    },
    "domainLookupEnd": {
      "type": "long"
    },
    "connectStart": {
      "type": "long"
    },
    "connectEnd": {
      "type": "long"
    },
    "secureConnectionStart": {
      "type": "long"
    },
    "requestStart": {
      "type": "long"
    },
    "responseStart": {
      "type": "long"
    },
    "responseEnd": {
      "type": "long"
    },
    "domLoading": {
      "type": "long"
    },
    "domInteractive": {
      "type": "long"
    },
    "domContentLoadedEventStart": {
      "type": "long"
    },
    "domContentLoadedEventEnd": {
      "type": "long"
    },
    "domComplete": {
      "type": "long"
    },
    "loadEventStart": {
      "type": "long"
    },
    "loadEventEnd": {
      "type": "long"
    }
  }
}

const common = {
  "properties": {
    "is_test": {
      "type": "boolean"
    },
    "jserror": {
      "type": "boolean"
    },
    "online": {
      "type": "boolean"
    },
    "page_type": {
      "type": "text",
      "fields": {
        "keyword": {
          "type": "keyword",
          "ignore_above": 256
        }
      }
    },
    "performance": {
      "type": "boolean"
    },
    "pid": {
      "type": "keyword",
    },
    "runtime_version": {
      "type": "keyword"
    },
    "sdk_version": {
      "type": "keyword"
    },
    "test": {
      "type": "boolean"
    },
    "timestamp": {
      "type": "long"
    },
    // 用户id可能不是数字
    "ucid": {
      "type": "text",
      "fields": {
        "keyword": {
          "type": "keyword",
          "ignore_above": 256
        }
      }
    },
    "uuid": {
      "type": "keyword"
    },
    "version": {
      "type": "keyword"
    }
  }
}


export default {
  name: 'dt-raw',
  body: {
    "index_patterns": ["dt-raw-*"],
    "settings": {
      "number_of_shards": 3,
      "number_of_replicas": 1
    },
    "mappings": {
      "_doc": {
        "properties": {
          "city": {
            "type": "keyword"
          },
          "code": {
            "type": "long"
          },
          "common": common,
          "country": {
            "type": "keyword"
          },
          "detail": detail,
          "extra": {
            "type": "text",
            "fields": {
              "keyword": {
                "type": "keyword",
                "ignore_above": 256
              }
            }
          },
          "ip": {
            "type": "keyword"
          },
          "project_id": {
            "type": "integer"
          },
          "project_name": {
            "type": "keyword"
          },
          "province": {
            "type": "keyword"
          },
          "time": {
            "type": "long"
          },
          "time_ms": {
            "type": "long"
          },
          "type": {
            "type": "keyword",
          },
          "ua": ua
        }
      }
    }
  }
}



