const yuzu = require('yuzu-definition-core');
const path = require('path');
const options = require(path.join(process.cwd(), 'yuzu.config.js'));

let lastBuildTimestamp = 0;
let externals = {};
let blockDependencies = [];

const buildBlockDependencies = (options) => {

  yuzu.build.register(options.registeredPartialsDirs, options.hbsHelpers);
  externals = yuzu.build.setup(options.renderedPartialDirs, options.layoutDir, options.autoSchemaProperties);
  blockDependencies = yuzu.build.getFilenamesInDirs(options.dependantDirectories);

}

module.exports = async function(source) {

  if(lastBuildTimestamp < (this._module.buildTimestamp - options.blockDependenciesTimeout) ) {
    buildBlockDependencies(options);
    lastBuildTimestamp = this._module.buildTimestamp;
  }

  errors = [];
  let blockFiles = yuzu.build.getBlockFiles(this.resourcePath);

  if(this.mode != 'production') {
    blockFiles.forEach(i => {
      this.addDependency(i);
    });

    blockDependencies.forEach(i => {
      this.addDependency(i);
    });
  }

  let renderedTemplate = yuzu.build.render(source, this.resourcePath, externals, errors);

  for (const e of errors) {
    const error = new Error();
    error.message = e.message;

    this.emitError(error);
  }

  return renderedTemplate;
}
