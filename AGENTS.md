# forensIQ Backend - Agent Instructions

## Security Protocols

### Secrets & Credentials
- Never commit secrets, API keys, passwords, or credentials to the repository
- Use environment variables or a secrets manager for all sensitive data
- If a secret is accidentally committed, remove it from history and rotate the key immediately
- Do not log or print secrets in any form (even partially masked)

### Data Handling
- Never expose or log sensitive user data in development
- Sanitize all inputs at trust boundaries before processing
- Validate and sanitize data from external sources (APIs, user input, file uploads)
- Use parameterized queries to prevent SQL injection

### API Security
- Implement proper authentication and authorization checks
- Use rate limiting on public endpoints
- Validate all API inputs and reject malformed requests
- Return generic error messages that don't leak internal details

### Code Review
- Review all code for security vulnerabilities before merging
- Check for common issues: XSS, CSRF, command injection, path traversal
- Ensure dependencies are up to date and free of known vulnerabilities
- Run security scanning tools as part of CI/CD

### Compliance
- Follow GDPR/CCPA data protection requirements
- Maintain audit logs for sensitive operations
- Implement data retention policies
- Ensure proper access controls on all resources

## Pre-Launch Checklist

1. Loading states
2. Empty states
3. Clear error messages
4. Form validation
5. Rate limiting
6. Database backups
7. Row-level security
8. API keys off the frontend
9. Mobile layout
10. Custom 404 page
11. Analytics installed
12. Error tracking
13. Privacy policy page
14. Terms page