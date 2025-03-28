const html = `<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>File Manager</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f4f8;
            color: #333;
            line-height: 1.6;
            padding: 20px;
            max-width: 800px;
            margin: 0 auto;
        }

        h1 {
            color: #2c3e50;
            text-align: center;
        }

        #file-list {
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 20px;
            margin-bottom: 20px;
        }

        #file-list h2 {
            margin-top: 0;
            color: #34495e;
        }

        #files {
            list-style-type: none;
            padding: 0;
        }

        #files li {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            border-bottom: 1px solid #ecf0f1;
        }

        #files li:last-child {
            border-bottom: none;
        }

        #upload-form {
            background-color: #fff;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 20px;
        }

        #upload-form h2 {
            margin-top: 0;
            color: #34495e;
        }

        input[type="file"] {
            display: none;
        }

        .file-input-label {
            display: inline-block;
            padding: 10px 15px;
            background-color: #3498db;
            color: #fff;
            border-radius: 4px;
            cursor: pointer;
        }

        .file-input-label:hover {
            background-color: #2980b9;
        }

        button {
            padding: 10px 15px;
            background-color: #2ecc71;
            color: #fff;
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }

        button:hover {
            background-color: #27ae60;
        }

        .delete-btn {
            background-color: #e74c3c;
            color: #fff;
            border: none;
            border-radius: 4px;
            padding: 5px 10px;
            cursor: pointer;
        }

        .delete-btn:hover {
            background-color: #c0392b;
        }

        #selected-file {
            margin-top: 10px;
            font-style: italic;
        }

        .loading {
            display: inline-block;
            width: 20px;
            height: 20px;
            border: 3px solid #f3f3f3;
            border-top: 3px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-left: 10px;
        }

        @keyframes spin {
            0% {
                transform: rotate(0deg);
            }

            100% {
                transform: rotate(360deg);
            }
        }

        #message {
            margin-top: 10px;
            padding: 10px;
            border-radius: 4px;
            display: none;
        }

        .success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }

        .error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>

<body>
    <h1>File Manager</h1>
    <div id="file-list">
        <h2>Files</h2>
        <ul id="files"></ul>
    </div>
    <div id="upload-form">
        <h2>Upload File</h2>
        <form id="upload">
            <label for="file-input" class="file-input-label">Choose File</label>
            <input type="file" id="file-input" required>
            <button type="submit">Upload</button>
        </form>
        <div id="selected-file"></div>
        <div id="message"></div>
    </div>
    <script>
        function loadFiles() {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', '/', true);
            xhr.setRequestHeader('Accept', 'application/json');
            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        var files = JSON.parse(xhr.responseText);
                        var fileList = document.getElementById('files');
                        fileList.innerHTML = '';
                        if (files.length === 0) {
                            fileList.innerHTML = '<li>No files found</li>';
                        } else {
                            for (var i = 0; i < files.length; i++) {
                                var file = files[i];
                                var li = document.createElement('li');
                                li.innerHTML = '<span>' + file.key + '</span>' +
                                    '<div>' +
                                    '<a href="/' + file.key + '" target="_blank">Download</a> ' +
                                    '<button class="delete-btn" data-key="' + file.key + '">Delete</button>' +
                                    '</div>';
                                fileList.appendChild(li);
                            }
                        }
                        addDeleteListeners();
                    } else {
                        console.error('Error loading files:', xhr.status);
                        document.getElementById('files').innerHTML = '<li>Error loading files</li>';
                    }
                }
            };
            xhr.send();
        }

        function checkAuth() {
            let auth = localStorage.getItem('auth')
            if (!auth) {
                auth = prompt('请输入凭据')
                if (auth) {
                    localStorage.setItem('auth', auth)
                } else {
                    showMessage('需要凭据', 'error');
                    return false
                }
            }
            return auth
        }

        function addAuthHeader(xhr, auth) {
            xhr.setRequestHeader('X-Custom-Auth-Key', auth);  // 添加认证头
        }

        function ifAuthFail(xhr) {
            if (xhr.status === 403) {
                localStorage.removeItem('auth')
            }
        }

        function addDeleteListeners() {
            // 将事件监听器添加到父元素
            document.getElementById('files').addEventListener('click', function (e) {
                // 检查点击的是否是删除按钮
                if (e.target && e.target.classList.contains('delete-btn')) {
                    const auth = checkAuth();
                    if (!auth) {
                        return;
                    }
                    var key = e.target.getAttribute('data-key');
                    var xhr = new XMLHttpRequest();
                    xhr.open('DELETE', '/' + key, true);
                    addAuthHeader(xhr, auth);
                    xhr.onreadystatechange = function () {
                        if (xhr.readyState === 4) {
                            if (xhr.status === 200) {
                                showMessage('File deleted successfully', 'success');
                                loadFiles();
                            } else {
                                showMessage('Error deleting file:' + xhr.status, 'error');
                                ifAuthFail(xhr)
                            }
                        }
                    };
                    xhr.send();
                }
            });
        }

        function showMessage(text, type) {
            var messageElement = document.getElementById('message');
            messageElement.textContent = text;
            messageElement.className = type;
            messageElement.style.display = 'block';
            setTimeout(function () {
                messageElement.style.display = 'none';
            }, 3000);
        }

        document.getElementById('file-input').addEventListener('change', function (e) {
            var fileName = e.target.files[0] ? e.target.files[0].name : 'No file selected';
            document.getElementById('selected-file').textContent = 'Selected file: ' + fileName;
        });

        document.getElementById('upload').addEventListener('submit', function (e) {
            const auth = checkAuth();
            if (!auth) {
                e.preventDefault();
                return
            }
            e.preventDefault();
            var fileInput = document.getElementById('file-input');
            var file = fileInput.files[0];
            if (file) {
                var xhr = new XMLHttpRequest();
                xhr.open('PUT', '/' + file.name, true);
                addAuthHeader(xhr, auth);

                var loadingSpinner = document.createElement('div');
                loadingSpinner.className = 'loading';
                e.target.appendChild(loadingSpinner);

                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        e.target.removeChild(loadingSpinner);
                        if (xhr.status === 200) {
                            showMessage('File uploaded successfully', 'success');
                            fileInput.value = '';
                            document.getElementById('selected-file').textContent = '';
                            loadFiles();
                        } else {
                            showMessage('Error uploading file:' + xhr.status, 'error');
                            ifAuthFail(xhr)
                        }
                    }
                };
                xhr.send(file);
            }
        });

        loadFiles();
    </script>
</body>

</html>`;

const hasValidHeader = (request, env) => {
	return request.headers.get('X-Custom-Auth-Key') === env.AUTH_KEY_SECRET;
};

function authorizeRequest(request, env, key) {
	switch (request.method) {
		case 'PUT':
		case 'DELETE':
			return hasValidHeader(request, env);
		case 'GET':
			return true;
		default:
			return false;
	}
}
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = decodeURI(url.pathname.slice(1));
    if (!authorizeRequest(request, env, key)) {
        return new Response('Forbidden\n', { status: 403 });
    }
    if (request.method === 'GET') {
      // Serve the HTML page
      if (url.pathname === '/' && request.headers.get('Accept').includes('text/html')) {
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' },
        });
      }

      // Return file list
      if (url.pathname === '/') {
        const list = await env.FILE_BUCKET.list();
        return new Response(JSON.stringify(list.objects), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      }

      // Handle file download
      if (key) {
        const object = await env.FILE_BUCKET.get(key);
        
        if (object === null) {
          return new Response('File not found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);

        return new Response(object.body, {
          headers,
        });
      }
    }
    if (request.method === 'PUT') {
      // Handle file upload
      const object = await request.arrayBuffer();
      await env.FILE_BUCKET.put(key, object, {
        httpMetadata: request.headers,
      }); 
      return new Response('File uploaded successfully', { status: 200 });
    }
    if (request.method === 'DELETE') {
      // Handle file deletion
      await env.FILE_BUCKET.delete(key);
      return new Response('File deleted successfully', { status: 200 });
    }
    return new Response('Method not allowed', { status: 405 });
  },
};