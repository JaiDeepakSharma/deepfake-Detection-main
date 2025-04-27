// API Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// DOM Elements
const imageUploadForm = document.getElementById('image-upload-form');
const videoUploadForm = document.getElementById('video-upload-form');
const audioUploadForm = document.getElementById('audio-upload-form');
const resultContainer = document.getElementById('result-container');

// Helper Functions
function showLoading() {
    resultContainer.innerHTML = `
        <div class="text-center">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2">Processing your file...</p>
        </div>
    `;
}

function showResult(result) {
    const isDeepfake = result.is_deepfake;
    const confidence = (result.confidence * 100).toFixed(2);
    const message = result.message;

    resultContainer.innerHTML = `
        <div class="card ${isDeepfake ? 'border-danger' : 'border-success'}">
            <div class="card-body">
                <h5 class="card-title">${isDeepfake ? 'Deepfake Detected!' : 'Authentic Content'}</h5>
                <p class="card-text">${message}</p>
                <div class="progress mb-3">
                    <div class="progress-bar ${isDeepfake ? 'bg-danger' : 'bg-success'}" 
                         role="progressbar" 
                         style="width: ${confidence}%" 
                         aria-valuenow="${confidence}" 
                         aria-valuemin="0" 
                         aria-valuemax="100">
                        ${confidence}% Confidence
                    </div>
                </div>
            </div>
        </div>
    `;
}

function showError(error) {
    resultContainer.innerHTML = `
        <div class="alert alert-danger" role="alert">
            <h4 class="alert-heading">Error!</h4>
            <p>${error}</p>
        </div>
    `;
}

// Function to handle file uploads
async function handleFileUpload(formId, fileInputId, endpoint) {
    const form = document.getElementById(formId);
    const fileInput = document.getElementById(fileInputId);
    const resultContainer = document.getElementById('result-container');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const file = fileInput.files[0];
        if (!file) {
            showError('Please select a file first');
            return;
        }

        // Show loading state
        resultContainer.innerHTML = `
            <div class="alert alert-info">
                <div class="spinner-border spinner-border-sm me-2" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                Analyzing your file...
            </div>
        `;

        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            displayResult(result);
        } catch (error) {
            console.error('Error:', error);
            showError(`Error: ${error.message}. Please make sure the server is running.`);
        }
    });

    // Handle file selection
    fileInput.addEventListener('change', () => {
        if (fileInput.files[0]) {
            form.dispatchEvent(new Event('submit'));
        }
    });
}

// Function to display results
function displayResult(result) {
    const resultContainer = document.getElementById('result-container');
    
    if (result.error) {
        showError(result.error);
        return;
    }
    
    let resultHtml = `
        <div class="card">
            <div class="card-body">
                <h5 class="card-title">Analysis Results</h5>
                <div class="alert ${result.is_deepfake ? 'alert-danger' : 'alert-success'}">
                    <strong>${result.is_deepfake ? 'Deepfake Detected!' : 'No Deepfake Detected'}</strong>
                </div>
                <p class="card-text">Confidence: ${(result.confidence * 100).toFixed(2)}%</p>
                ${result.details ? `<p class="card-text">Details: ${result.details}</p>` : ''}
            </div>
        </div>
    `;
    
    resultContainer.innerHTML = resultHtml;
}

// Function to show error messages
function showError(message) {
    const resultContainer = document.getElementById('result-container');
    resultContainer.innerHTML = `
        <div class="alert alert-danger">
            ${message}
        </div>
    `;
}

// Initialize file upload handlers
document.addEventListener('DOMContentLoaded', () => {
    // Image upload handler
    handleFileUpload('image-upload-form', 'image-input', '/api/analyze/image');
    
    // Video upload handler
    handleFileUpload('video-upload-form', 'video-input', '/api/analyze/video');
    
    // Audio upload handler
    handleFileUpload('audio-upload-form', 'audio-input', '/api/analyze/audio');
});

// File Input Validation
document.querySelectorAll('input[type="file"]').forEach(input => {
    input.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const maxSize = 16 * 1024 * 1024; // 16MB
            if (file.size > maxSize) {
                showError('File size exceeds 16MB limit');
                e.target.value = '';
            }
        }
    });
}); 