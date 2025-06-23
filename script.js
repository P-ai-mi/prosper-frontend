/* Corrected and Ready for Upload as script.js */
document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const BACKEND_API_URL = 'https://prosper-ai-service-1055934371160.us-central1.run.app/analyze-resume';

    // --- DOM Elements ---
    const resumeFile = document.getElementById('resumeFile');
    const resumeTextarea = document.getElementById('resumeText');
    const zipCodeInput = document.getElementById('zipCode');
    const analyzeButton = document.getElementById('analyzeBtn');
    const loadingDiv = document.getElementById('loading');
    const reportOutputDiv = document.getElementById('reportOutput');

    // --- Event Listeners ---
    analyzeButton.addEventListener('click', analyzeResume);

    resumeFile.addEventListener('change', () => {
        if (resumeFile.files.length > 0) {
            resumeTextarea.value = '';
        }
    });

    resumeTextarea.addEventListener('input', () => {
        if (resumeTextarea.value.trim() !== '') {
            resumeFile.value = '';
        }
    });

    // --- Core Function: Analyze Resume ---
    async function analyzeResume() {
        let resumeContent = '';
        const zipCode = zipCodeInput.value.trim();

        if (resumeFile.files.length > 0) {
            const file = resumeFile.files[0];
            if (file.type !== 'text/plain') {
                showError('Please upload a plain text (.txt) file. For other formats like PDF/Word, please copy and paste the text into the text area.');
                return;
            }
            loadingDiv.classList.remove('hidden');
            reportOutputDiv.innerHTML = '<p>Reading file...</p>';
            try {
                resumeContent = await readFileContent(file);
            } catch (error) {
                showError(`Error reading file: ${error.message}`);
                return;
            }
        } else if (resumeTextarea.value.trim()) {
            resumeContent = resumeTextarea.value.trim();
        } else {
            showError('Please upload a resume file or paste your resume text.');
            return;
        }
        
        // Corrected validation: Check for 5 digits.
        if (!/^\d{5}$/.test(zipCode)) {
            showError('Please enter a valid 5-digit ZIP code.');
            return;
        }

        analyzeButton.disabled = true;
        loadingDiv.classList.remove('hidden');
        reportOutputDiv.innerHTML = '<p class="loading-message">Analyzing resume with PROSPER AI...</p>';
        
        try {
            const response = await fetch(BACKEND_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    resume_text: resumeContent,
                    zip_code: zipCode
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: 'Unknown server error.' }));
                throw new Error(`HTTP error! Status: ${response.status} - ${errorData.error || 'Check backend logs.'}`);
            }

            const data = await response.json();

            if (data.success) {
                // Use marked.js (loaded in the HTML) to render markdown to HTML
                reportOutputDiv.innerHTML = marked.parse(data.report_markdown);
            } else {
                showError(`Analysis failed: ${data.error || 'Unknown error.'}`);
            }

        } catch (error) {
            showError(`An error occurred: ${error.message}. Please check your internet connection and verify the backend API URL.`);
            console.error('Fetch error:', error);
        } finally {
            analyzeButton.disabled = false;
            loadingDiv.classList.add('hidden');
        }
    }

    function readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    }

    function showError(message) {
        // Corrected this line to properly display the message
        reportOutputDiv.innerHTML = `<p class="error">Error: ${message}</p>`;
        loadingDiv.classList.add('hidden');
        analyzeButton.disabled = false;
    }
});