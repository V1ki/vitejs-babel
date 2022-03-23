function testPluginFunction({ types: t }) {
  return {
    visitor: {
      Identifier: {
        enter(path) {
          console.log('Entered!', path.node);
        },
        exit() {
          console.log('Exited!');
        },
      },
    },
  };
}
module.exports = testPluginFunction;
