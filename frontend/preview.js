function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function isPreviewable(ext) {
  return ['pdf'].includes(ext);
}

function fileExtension(filename) {
  const idx = filename.lastIndexOf('.');
  return idx >= 0 ? filename.slice(idx + 1).toLowerCase() : '';
}

function safeEncode(filename) {
  return encodeURIComponent(filename);
}

function showError(message) {
  const previewFrame = document.getElementById('preview-frame');
  previewFrame.innerHTML = `<div class="empty-state"><p>${message}</p></div>`;
}

function renderPreview(fileName) {
  const encodedFile = safeEncode(fileName);
  const fileUrl = `/uploads/${encodedFile}`;
  const downloadLink = document.getElementById('download-link');
  const fileNameElement = document.getElementById('file-name');
  const fileTypeElement = document.getElementById('file-type');
  const previewFrame = document.getElementById('preview-frame');

  fileNameElement.textContent = fileName;
  const ext = fileExtension(fileName);
  fileTypeElement.textContent = ext ? ext.toUpperCase() : 'Unknown type';
  downloadLink.href = fileUrl;
  downloadLink.setAttribute('download', fileName);

  if (isPreviewable(ext)) {
    previewFrame.innerHTML = `<iframe src="${fileUrl}" title="Resume preview"></iframe>`;
  } else {
    previewFrame.innerHTML = `
      <div class="empty-state">
        <p>Preview is not available for this file type.</p>
        <p>Use the download button to save the file.</p>
      </div>
    `;
  }
}

const resumeFile = getQueryParam('file');
if (!resumeFile) {
  showError('No resume selected for preview.');
} else {
  renderPreview(resumeFile);
}
