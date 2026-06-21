const Module = require('module');
const originalCompile = Module.prototype._compile;

Module.prototype._compile = function(content, filename) {
  try {
    return originalCompile.apply(this, arguments);
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.error('\n=========================================');
      console.error('COMPILE ERROR IN FILE:', filename);
      console.error(err.stack || err);
      console.error('=========================================\n');
    }
    throw err;
  }
};
