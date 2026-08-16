require('dotenv').config();
const { runATSScan } = require('./services/gemini');

async function testFullScan() {
  console.log('Testing runATSScan with real Gemini API call...');
  try {
    const resumeText = `
Name: Kartik Bareja
Title: Full Stack Software Engineer
Email: kartik@example.com | LinkedIn: linkedin.com/in/kartik | GitHub: github.com/kartik

Professional Summary
Results-driven software engineer with 3+ years experience designing scalable web applications using React, Node.js, and MongoDB.

Work Experience
Software Engineer | Acme Corp (Jan 2023 - Present)
- Architected and deployed microservices backend using Node.js, Express, and MongoDB, reducing API latency by 35%.
- Built responsive user dashboards in React and Tailwind CSS serving 50,000+ daily active users.
- Automated CI/CD pipelines using GitHub Actions, speeding up release cycles by 40%.

Education
B.Tech Computer Science | Tech University (2019 - 2023)

Skills
JavaScript, TypeScript, React, Node.js, Express, MongoDB, Git, Docker, REST APIs
`;

    const jobDescription = `
We are looking for a Full Stack Software Engineer proficient in React, Node.js, TypeScript, and MongoDB.
Experience with RESTful APIs, cloud deployment (AWS/Docker), and building high-traffic web applications is required.
Strong problem-solving skills and experience with CI/CD pipelines.
`;

    const result = await runATSScan({ resumeText, jobDescription });
    console.log('=== ATS SCAN RESULT FROM GEMINI ===');
    console.log(JSON.stringify(result, null, 2));
    console.log('\n>>> ATS SCAN TEST PASSED SUCCESSFULLY! <<<');
  } catch (err) {
    console.error('Test Failed:', err);
  }
}

testFullScan();
