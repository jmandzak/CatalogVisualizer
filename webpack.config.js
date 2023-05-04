// Copyright 2023, Josh Mandzak & Swasti Mishra

const path = require("path");

module.exports = {
    "entry": "./index.js",
    "output": {
        "path": path.resolve("dist"),
        "filename": "bundle.js"
    },
    "devtool": "source-map"
}