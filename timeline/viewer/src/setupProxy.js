/**
 * Webpack Dev Server Proxy Configuration
 * Serves static API files from ../data/api/ during development
 */

const path = require('path');
const fs = require('fs');

module.exports = function(app) {
  // Serve timeline API files from ../data/api/
  app.get('/api/:file', (req, res) => {
    const filename = req.params.file;
    const filePath = path.resolve(__dirname, '../../data/api', filename);

    console.log(`[setupProxy] Serving ${filename} from ${filePath}`);

    if (fs.existsSync(filePath)) {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.sendFile(filePath);
    } else {
      console.error(`[setupProxy] File not found: ${filePath}`);
      res.status(404).json({ error: 'File not found' });
    }
  });
};
