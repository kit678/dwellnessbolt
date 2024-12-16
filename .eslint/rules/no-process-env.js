module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'disallow use of process.env in client-side code',
      category: 'Best Practices',
      recommended: true,
    },
    schema: [], // no options
  },
  create: function (context) {
    return {
      MemberExpression(node) {
        if (
          node.object.name === 'process' &&
          node.property.name === 'env'
        ) {
          context.report({
            node,
            message: 'Use import.meta.env instead of process.env in client-side code.',
          });
        }
      },
    };
  },
};
