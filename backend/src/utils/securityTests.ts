import axios from 'axios';
import { performance } from 'perf_hooks';

interface SecurityTestResult {
  testName: string;
  passed: boolean;
  details: string;
  responseTime?: number;
}

class SecurityTester {
  private baseURL: string;
  private results: SecurityTestResult[] = [];

  constructor(baseURL: string = 'http://localhost:5000/api') {
    this.baseURL = baseURL;
  }

  private addResult(testName: string, passed: boolean, details: string, responseTime?: number) {
    this.results.push({ testName, passed, details, responseTime });
  }

  // Test SQL Injection attempts
  async testSQLInjection(): Promise<void> {
    const sqlPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 1=1#",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --"
    ];

    for (const payload of sqlPayloads) {
      try {
        const start = performance.now();
        const response = await axios.post(`${this.baseURL}/auth/login`, {
          email: payload,
          password: 'test'
        });
        const end = performance.now();

        // If we get here without error, check if the response indicates success
        const passed = response.status !== 200 && !response.data.token;
        this.addResult(
          `SQL Injection Test: ${payload.substring(0, 20)}...`,
          passed,
          passed ? 'Blocked successfully' : 'VULNERABILITY: SQL injection may be possible',
          end - start
        );
      } catch (error: any) {
        // Error is expected - SQL injection should be blocked
        const passed = error.response?.status === 400 || error.response?.status === 403;
        this.addResult(
          `SQL Injection Test: ${payload.substring(0, 20)}...`,
          passed,
          passed ? 'Blocked successfully' : `Unexpected error: ${error.message}`,
          0
        );
      }
    }
  }

  // Test XSS attempts
  async testXSS(): Promise<void> {
    const xssPayloads = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<svg onload=alert('XSS')>",
      "';alert('XSS');//",
      "<iframe src='javascript:alert(\"XSS\")'></iframe>"
    ];

    for (const payload of xssPayloads) {
      try {
        const start = performance.now();
        const response = await axios.post(`${this.baseURL}/auth/register`, {
          name: payload,
          email: 'test@example.com',
          phone: '1234567890',
          password: 'Test123!@#',
          age: 25,
          gender: 'MALE',
          address: {
            street: '123 Test St',
            city: 'Test City',
            zipCode: '12345'
          }
        });
        const end = performance.now();

        // Check if XSS payload was sanitized
        const passed = !response.data.user?.name?.includes('<script>') && 
                      !response.data.user?.name?.includes('javascript:');
        this.addResult(
          `XSS Test: ${payload.substring(0, 20)}...`,
          passed,
          passed ? 'XSS payload sanitized' : 'VULNERABILITY: XSS payload not sanitized',
          end - start
        );
      } catch (error: any) {
        // Error might be expected if validation blocks the payload
        const passed = error.response?.status === 400;
        this.addResult(
          `XSS Test: ${payload.substring(0, 20)}...`,
          passed,
          passed ? 'XSS payload blocked by validation' : `Unexpected error: ${error.message}`,
          0
        );
      }
    }
  }

  // Test CSRF protection
  async testCSRF(): Promise<void> {
    try {
      // First, try to make a request without CSRF token
      const start = performance.now();
      const response = await axios.post(`${this.baseURL}/cases`, {
        caseType: 'FAMILY',
        issueDescription: 'Test case without CSRF token'
      });
      const end = performance.now();

      const passed = response.status === 403;
      this.addResult(
        'CSRF Protection Test',
        passed,
        passed ? 'CSRF protection working' : 'VULNERABILITY: CSRF protection not working',
        end - start
      );
    } catch (error: any) {
      const passed = error.response?.status === 403 || error.response?.status === 401;
      this.addResult(
        'CSRF Protection Test',
        passed,
        passed ? 'CSRF protection working' : `Unexpected error: ${error.message}`,
        0
      );
    }
  }

  // Test rate limiting
  async testRateLimit(): Promise<void> {
    const requests = [];
    const start = performance.now();

    // Send multiple requests rapidly
    for (let i = 0; i < 10; i++) {
      requests.push(
        axios.post(`${this.baseURL}/auth/login`, {
          email: 'test@example.com',
          password: 'wrongpassword'
        }).catch(error => error.response)
      );
    }

    try {
      const responses = await Promise.all(requests);
      const end = performance.now();

      // Check if any requests were rate limited
      const rateLimited = responses.some(response => 
        response?.status === 429 || 
        response?.data?.message?.includes('Too many')
      );

      this.addResult(
        'Rate Limiting Test',
        rateLimited,
        rateLimited ? 'Rate limiting working' : 'VULNERABILITY: Rate limiting not working',
        end - start
      );
    } catch (error: any) {
      this.addResult(
        'Rate Limiting Test',
        false,
        `Error testing rate limiting: ${error.message}`,
        0
      );
    }
  }

  // Test file upload security
  async testFileUploadSecurity(): Promise<void> {
    const maliciousFiles = [
      { name: 'test.exe', content: 'MZ\x90\x00', mimeType: 'application/octet-stream' },
      { name: 'test.php', content: '<?php echo "hack"; ?>', mimeType: 'application/x-php' },
      { name: 'test.js', content: 'alert("xss")', mimeType: 'application/javascript' },
      { name: '../../../etc/passwd', content: 'root:x:0:0:root:/root:/bin/bash', mimeType: 'text/plain' }
    ];

    for (const file of maliciousFiles) {
      try {
        const formData = new FormData();
        const blob = new Blob([file.content], { type: file.mimeType });
        formData.append('photo', blob, file.name);
        formData.append('name', 'Test User');
        formData.append('email', 'test@example.com');
        formData.append('phone', '1234567890');
        formData.append('password', 'Test123!@#');
        formData.append('age', '25');
        formData.append('gender', 'MALE');
        formData.append('address[street]', '123 Test St');
        formData.append('address[city]', 'Test City');
        formData.append('address[zipCode]', '12345');

        const start = performance.now();
        const response = await axios.post(`${this.baseURL}/auth/register`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        const end = performance.now();

        // File upload should be rejected
        const passed = false; // If we get here, the malicious file was accepted
        this.addResult(
          `File Upload Security: ${file.name}`,
          passed,
          'VULNERABILITY: Malicious file was accepted',
          end - start
        );
      } catch (error: any) {
        const passed = error.response?.status === 400;
        this.addResult(
          `File Upload Security: ${file.name}`,
          passed,
          passed ? 'Malicious file rejected' : `Unexpected error: ${error.message}`,
          0
        );
      }
    }
  }

  // Test authentication bypass attempts
  async testAuthBypass(): Promise<void> {
    const bypassAttempts = [
      { token: 'fake-jwt-token', description: 'Fake JWT token' },
      { token: 'Bearer fake-token', description: 'Fake Bearer token' },
      { token: '', description: 'Empty token' },
      { token: 'null', description: 'Null token' },
      { token: 'undefined', description: 'Undefined token' }
    ];

    for (const attempt of bypassAttempts) {
      try {
        const start = performance.now();
        const response = await axios.get(`${this.baseURL}/users/profile`, {
          headers: { Authorization: attempt.token }
        });
        const end = performance.now();

        const passed = false; // Should not succeed
        this.addResult(
          `Auth Bypass: ${attempt.description}`,
          passed,
          'VULNERABILITY: Authentication bypass successful',
          end - start
        );
      } catch (error: any) {
        const passed = error.response?.status === 401 || error.response?.status === 403;
        this.addResult(
          `Auth Bypass: ${attempt.description}`,
          passed,
          passed ? 'Authentication properly enforced' : `Unexpected error: ${error.message}`,
          0
        );
      }
    }
  }

  // Test parameter pollution
  async testParameterPollution(): Promise<void> {
    try {
      const start = performance.now();
      const response = await axios.get(`${this.baseURL}/cases?page=1&page=999&limit=10&limit=1000`);
      const end = performance.now();

      // Check if only the first parameter value was used
      const passed = response.data.pagination?.page === 1 && response.data.pagination?.limit === 10;
      this.addResult(
        'Parameter Pollution Test',
        passed,
        passed ? 'Parameter pollution prevented' : 'VULNERABILITY: Parameter pollution possible',
        end - start
      );
    } catch (error: any) {
      this.addResult(
        'Parameter Pollution Test',
        false,
        `Error testing parameter pollution: ${error.message}`,
        0
      );
    }
  }

  // Test security headers
  async testSecurityHeaders(): Promise<void> {
    try {
      const start = performance.now();
      const response = await axios.get(`${this.baseURL}/health`);
      const end = performance.now();

      const headers = response.headers;
      const requiredHeaders = [
        'x-frame-options',
        'x-content-type-options',
        'x-xss-protection'
      ];

      const missingHeaders = requiredHeaders.filter(header => !headers[header]);
      const passed = missingHeaders.length === 0;

      this.addResult(
        'Security Headers Test',
        passed,
        passed ? 'All security headers present' : `Missing headers: ${missingHeaders.join(', ')}`,
        end - start
      );
    } catch (error: any) {
      this.addResult(
        'Security Headers Test',
        false,
        `Error testing security headers: ${error.message}`,
        0
      );
    }
  }

  // Run all security tests
  async runAllTests(): Promise<SecurityTestResult[]> {
    console.log('Starting comprehensive security tests...\n');

    await this.testSQLInjection();
    await this.testXSS();
    await this.testCSRF();
    await this.testRateLimit();
    await this.testFileUploadSecurity();
    await this.testAuthBypass();
    await this.testParameterPollution();
    await this.testSecurityHeaders();

    return this.results;
  }

  // Generate security report
  generateReport(): string {
    const totalTests = this.results.length;
    const passedTests = this.results.filter(r => r.passed).length;
    const failedTests = totalTests - passedTests;

    let report = `
=== SECURITY TEST REPORT ===
Total Tests: ${totalTests}
Passed: ${passedTests}
Failed: ${failedTests}
Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%

=== DETAILED RESULTS ===
`;

    this.results.forEach((result, index) => {
      const status = result.passed ? '✅ PASS' : '❌ FAIL';
      const time = result.responseTime ? ` (${result.responseTime.toFixed(2)}ms)` : '';
      
      report += `
${index + 1}. ${result.testName} - ${status}${time}
   ${result.details}
`;
    });

    const vulnerabilities = this.results.filter(r => !r.passed && r.details.includes('VULNERABILITY'));
    if (vulnerabilities.length > 0) {
      report += `
=== CRITICAL VULNERABILITIES FOUND ===
`;
      vulnerabilities.forEach((vuln, index) => {
        report += `${index + 1}. ${vuln.testName}: ${vuln.details}\n`;
      });
    }

    return report;
  }
}

// Export for use in tests
export { SecurityTester, SecurityTestResult };

// CLI usage
if (require.main === module) {
  const tester = new SecurityTester();
  
  tester.runAllTests().then(() => {
    console.log(tester.generateReport());
    
    const vulnerabilities = tester.results.filter(r => !r.passed && r.details.includes('VULNERABILITY'));
    process.exit(vulnerabilities.length > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Security testing failed:', error);
    process.exit(1);
  });
}