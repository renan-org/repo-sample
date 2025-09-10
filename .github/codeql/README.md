# CodeQL Configuration Guide

This directory contains the CodeQL configuration for the Node.js Express application.

## Files Overview

- **`codeql-config.yml`**: Main configuration file that defines:
  - Query packs and suites to run
  - Paths to include/exclude from analysis
  - Language-specific settings
  - Query filters

- **`custom-suite.qls`**: Custom query suite tailored for Express/Node.js applications
- **`queries/`**: Directory for custom CodeQL queries

## Configuration Highlights

### Query Packs
- `security-and-quality`: Comprehensive security and code quality queries
- `security-extended`: Extended security query pack
- Custom suite focused on Express.js patterns

### Path Configuration
**Included:**
- `server.js` (main application file)
- All JavaScript files (`**/*.js`)
- Package configuration (`**/*.json`)

**Excluded:**
- `node_modules/` (dependencies)
- `tests/` (test files)
- `coverage/` (test coverage reports)
- Minified files (`*.min.js`)

### Security Features
- ML-powered queries enabled
- Focus on problem and path-problem queries
- Filtering by severity (errors and warnings)
- Exclusion of experimental queries for stability

## Customization Options

### Adding Custom Queries
1. Create `.ql` files in the `queries/` directory
2. Add proper metadata headers with `@name`, `@description`, `@kind`, etc.
3. Reference them in `codeql-config.yml` or `custom-suite.qls`

### Modifying Analysis Scope
- Edit `paths` and `paths-ignore` in `codeql-config.yml`
- Adjust query filters to change severity levels
- Modify the custom suite to include/exclude specific query types

### Language-Specific Settings
The configuration is optimized for JavaScript/Node.js:
- TypeScript support enabled
- Node.js specific patterns included
- Express.js security patterns prioritized

## Testing Your Configuration

1. Push changes to trigger the CodeQL workflow
2. Check the Actions tab for analysis results
3. Review Security tab for any detected issues
4. Iterate on configuration based on results

## Best Practices

1. **Start Conservative**: Begin with standard query packs, then add custom queries
2. **Regular Updates**: Keep query packs updated with latest security patterns
3. **False Positive Management**: Use query filters to reduce noise
4. **Performance**: Balance comprehensive analysis with workflow execution time
5. **Documentation**: Keep this README updated with configuration changes

## Troubleshooting

- **Analysis Timeout**: Reduce scope by excluding more paths
- **Too Many Results**: Increase severity filters or exclude noisy query types
- **Missing Languages**: Ensure languages match your workflow matrix
- **Custom Query Errors**: Validate query syntax using CodeQL CLI locally

## Resources

- [CodeQL Documentation](https://docs.github.com/en/code-security/code-scanning)
- [CodeQL Query Reference](https://codeql.github.com/docs/)
- [JavaScript/TypeScript Query Pack](https://github.com/github/codeql/tree/main/javascript)
