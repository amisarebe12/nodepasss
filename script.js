const APP_VERSION = '1.1';

window.addEventListener('load', () => {
    document.getElementById('loading-overlay').style.display = 'none';
});

document.addEventListener('DOMContentLoaded', () => {
    // Thêm dòng này vào đầu hàm
    document.getElementById('version').textContent = `Phiên bản ${APP_VERSION}`;

    const noteList = document.getElementById('note-list');
    const noteForm = document.getElementById('note-form');
    const noteTitleInput = document.getElementById('note-title');
    const noteContent = document.getElementById('note-content');
    const noteLinkInput = document.getElementById('note-link');
    const copyLinkButton = document.getElementById('copy-link');
    const darkModeToggle = document.getElementById('dark-mode-toggle');
    const exportNotesBtn = document.getElementById('export-notes');
    const importNotesBtn = document.getElementById('import-notes');
    const importFile = document.getElementById('import-file');
    const customizeThemeBtn = document.getElementById('customize-theme');
    const editorToolbar = document.getElementById('editor-toolbar');
    const encryptNoteCheckbox = document.getElementById('encrypt-note');
    const encryptionPassword = document.getElementById('encryption-password');
    const insertImageBtn = document.getElementById('insert-image');
    const imageUpload = document.getElementById('image-upload');
    const addNoteBtn = document.getElementById('add-note');

    // Hàm để tạo ID duy nhất cho ghi chú
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Hàm để lấy ghi chú từ LocalStorage
    function getNotes() {
        return JSON.parse(localStorage.getItem('notes')) || [];
    }

    // Hàm để lưu ghi chú vào LocalStorage
    function saveNotes(notes) {
        localStorage.setItem('notes', JSON.stringify(notes));
    }

    // Hàm để hiển thị ghi chú
    function displayNotes() {
        const notes = getNotes();
        if (notes.length === 0) {
            // Hiển thị skeleton loading nếu không có ghi chú
            noteList.innerHTML = `
                <div class="note-skeleton"></div>
                <div class="note-skeleton"></div>
                <div class="note-skeleton"></div>
            `;
        } else {
            // Hiển thị ghi chú như bình thường
            noteList.innerHTML = notes.map((note, index) => `
                <div class="note">
                    <h3>${note.title}</h3>
                    <div style="text-align: ${note.alignment || 'left'}">
                        ${note.encrypted ? '(Encrypted)' : note.content}
                    </div>
                    <button onclick="editNote(${index})">Sửa</button>
                    <button onclick="deleteNote(${index})">Xóa</button>
                    <button onclick="showLink('${note.id}')">Hiển thị link</button>
                    ${note.encrypted ? `<button onclick="decryptNote(${index})">Giải mã</button>` : ''}
                </div>
            `).join('');
        }
    }

    // Hàm để thêm ghi chú mới
    function addNote(title, content, id = null) {
        const notes = getNotes();
        let encryptedContent = content;
        if (encryptNoteCheckbox.checked && encryptionPassword.value) {
            encryptedContent = CryptoJS.AES.encrypt(content, encryptionPassword.value).toString();
        }
        const alignment = getAlignmentState();
        const newNote = { 
            id: id || generateUniqueId(), 
            title, 
            content: encryptedContent, 
            encrypted: encryptNoteCheckbox.checked,
            alignment: alignment
        };
        notes.push(newNote);
        saveNotes(notes);
        displayNotes();
        showLink(newNote.id);
        
        // Clear the input fields after adding a note
        noteTitleInput.value = '';
        noteContent.innerHTML = '';
        
        const progressBar = document.getElementById('save-progress');
        progressBar.style.width = '100%';
        setTimeout(() => {
            progressBar.style.width = '0';
        }, 1000);
    }

    // Xử lý sự kiện submit form
    noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        addNote(noteTitleInput.value, noteContent.innerHTML);
    });

    // Hàm để xóa ghi chú
    window.deleteNote = (index) => {
        const notes = getNotes();
        notes.splice(index, 1);
        saveNotes(notes);
        displayNotes();
        noteLinkInput.value = '';
    }

    // Hàm để sửa ghi chú
    window.editNote = (index) => {
        const notes = getNotes();
        const note = notes[index];
        noteTitleInput.value = note.title;
        noteContent.innerHTML = note.encrypted ? '(Encrypted)' : note.content;
        noteContent.style.textAlign = note.alignment || 'left';
        encryptNoteCheckbox.checked = note.encrypted;
        encryptionPassword.style.display = note.encrypted ? 'block' : 'none';
        notes.splice(index, 1);
        saveNotes(notes);
        displayNotes();
        showLink(note.id);

        // Cập nhật trạng thái active của các nút căn lề
        document.querySelectorAll('[data-command^="justify"]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.command === `justify${note.alignment.charAt(0).toUpperCase() + note.alignment.slice(1)}`) {
                btn.classList.add('active');
            }
        });
    }

    // Hàm để hiển thị link ghi chú
    window.showLink = (noteId) => {
        const link = `${window.location.origin}${window.location.pathname}?note=${noteId}`;
        noteLinkInput.value = link;
    }

    // Xử lý sự kiện sao chép link
    copyLinkButton.addEventListener('click', () => {
        noteLinkInput.select();
        document.execCommand('copy');
        alert('Đã sao chép link vào clipboard!');
    });

    // Hàm để hiển thị ghi chú từ link
    function displayNoteFromLink() {
        const urlParams = new URLSearchParams(window.location.search);
        const noteId = urlParams.get('note');
        if (noteId) {
            const notes = getNotes();
            const note = notes.find(n => n.id === noteId);
            if (note) {
                noteList.innerHTML = `
                    <div class="note">
                        <h3>${note.title}</h3>
                        <div style="text-align: ${note.alignment || 'left'}">
                            ${note.encrypted ? '(Encrypted)' : note.content}
                        </div>
                    </div>
                `;
                showLink(noteId);
                return true;
            }
        }
        return false;
    }

    // Hiển thị ghi chú khi trang được tải
    if (!displayNoteFromLink()) {
        displayNotes();
    }

    // Xử lý sự kiện thay đổi kích thước cửa sổ
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // Chế độ tối/sáng
    darkModeToggle.addEventListener('click', () => {
        if (document.body.getAttribute('data-theme') === 'dark') {
            document.body.removeAttribute('data-theme');
            localStorage.setItem('darkMode', 'disabled');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i>';
        } else {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkMode', 'enabled');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i>';
        }
    });

    // Xuất ghi chú
    exportNotesBtn.addEventListener('click', () => {
        const notes = getNotes();
        const blob = new Blob([JSON.stringify(notes)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'notes.json';
        a.click();
    });

    // Nhập ghi chú
    importNotesBtn.addEventListener('click', () => {
        importFile.click();
    });

    importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const importedNotes = JSON.parse(event.target.result);
                saveNotes(importedNotes);
                displayNotes();
            };
            reader.readAsText(file);
        }
    });

    // Chỉnh sửa văn bản nâng cao
    editorToolbar.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON' || e.target.parentElement.tagName === 'BUTTON') {
            const button = e.target.tagName === 'BUTTON' ? e.target : e.target.parentElement;
            const command = button.dataset.command;

            if (command === 'justifyLeft' || command === 'justifyCenter' || command === 'justifyRight' || command === 'justifyFull') {
                // Xóa lớp active từ tất cả các nút căn lề
                document.querySelectorAll('[data-command^="justify"]').forEach(btn => btn.classList.remove('active'));
                // Thêm lớp active cho nút được nhấn
                button.classList.add('active');
            }

            document.execCommand(command, false, null);
            noteContent.focus();
        }
    });

    // Mã hóa ghi chú
    encryptNoteCheckbox.addEventListener('change', () => {
        encryptionPassword.style.display = encryptNoteCheckbox.checked ? 'block' : 'none';
    });

    // Tự động lưu
    let autoSaveTimeout;
    noteContent.addEventListener('input', () => {
        clearTimeout(autoSaveTimeout);
        autoSaveTimeout = setTimeout(() => {
            // Thực hiện lưu tự động ở đây
            console.log('Auto-saving...');
        }, 2000);
    });

    // Chèn hình ảnh
    insertImageBtn.addEventListener('click', () => {
        imageUpload.click();
    });

    imageUpload.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = document.createElement('img');
                img.src = event.target.result;
                noteContent.appendChild(img);
            };
            reader.readAsDataURL(file);
        }
    });

    // Tùy chỉnh giao diện
    customizeThemeBtn.addEventListener('click', () => {
        // Hiển thị modal hoặc form để tùy chỉnh màu sắc
        console.log('Customize theme clicked');
    });

    // Thêm hàm giải mã ghi chú
    window.decryptNote = (index) => {
        const notes = getNotes();
        const note = notes[index];
        const password = prompt('Nhập mật khẩu để giải mã:');
        if (password) {
            try {
                const decryptedContent = CryptoJS.AES.decrypt(note.content, password).toString(CryptoJS.enc.Utf8);
                alert('Nội dung giải mã: ' + decryptedContent);
            } catch (error) {
                alert('Mật khẩu không đúng hoặc ghi chú không thể giải mã.');
            }
        }
    }

    // Thêm event listener cho nút ADD
    addNoteBtn.addEventListener('click', () => {
        // Xóa nội dung hiện tại của form
        noteTitleInput.value = '';
        noteContent.innerHTML = '';
        encryptNoteCheckbox.checked = false;
        encryptionPassword.value = '';
        encryptionPassword.style.display = 'none';

        // Tạo ID mới cho ghi chú
        const newNoteId = generateUniqueId();

        // Hiển thị form để người dùng nhập nội dung mới
        noteForm.style.display = 'block';

        // Cập nhật hàm xử lý submit form
        noteForm.onsubmit = (e) => {
            e.preventDefault();
            addNote(noteTitleInput.value, noteContent.innerHTML, newNoteId);
            noteForm.reset();
        };
    });

    // Hàm để lưu trạng thái căn lề
    function getAlignmentState() {
        const alignment = window.getComputedStyle(noteContent).getPropertyValue('text-align');
        return alignment;
    }

    // Thêm vào cuối file script.js
    const searchInput = document.getElementById('search-notes');
    searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.toLowerCase();
        const notes = document.querySelectorAll('.note');
        notes.forEach(note => {
            const title = note.querySelector('h3').textContent.toLowerCase();
            const content = note.querySelector('div').textContent.toLowerCase();
            if (title.includes(searchTerm) || content.includes(searchTerm)) {
                note.style.display = 'block';
            } else {
                note.style.display = 'none';
            }
        });
    });

    const title = document.getElementById('title');
    title.setAttribute('data-text', title.textContent);

    document.addEventListener('mousemove', (e) => {
        const mouseX = e.clientX;
        const mouseY = e.clientY;
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const percentX = (mouseX - centerX) / centerX;
        const percentY = (mouseY - centerY) / centerY;
        
        title.style.transform = `translate(${percentX * 10}px, ${percentY * 10}px)`;
    });

    const audio = new Audio('music/enddesslove.mp3'); // Đường dẫn đến file nhạc của bạn
    audio.loop = true; // Để nhạc lặp lại
    
    document.getElementById('toggle-music').addEventListener('click', toggleMusic);
    let isMusicPlaying = false;
    let isVolumeOn = true;

    // Hàm để tắt/bật nhạc
    function toggleMusic() {
        if (isMusicPlaying) {
            audio.pause();
            isMusicPlaying = false;
            document.getElementById('toggle-music').innerHTML = '<i class="fas fa-play"></i>'; // Biểu tượng play
        } else {
            audio.play();
            isMusicPlaying = true;
            document.getElementById('toggle-music').innerHTML = '<i class="fas fa-pause"></i>'; // Biểu tượng pause
        }
    }

    // Hàm để tắt/bật âm lượng
    function toggleVolume() {
        isVolumeOn = !isVolumeOn;
        audio.volume = isVolumeOn ? 1 : 0; // 1 là âm lượng tối đa, 0 là tắt âm
        document.getElementById('toggle-volume').innerHTML = isVolumeOn ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>'; // Biểu tượng âm lượng
    }

    // Thêm event listener cho các nút
    document.getElementById('toggle-music').addEventListener('click', toggleMusic);
    document.getElementById('toggle-volume').addEventListener('click', toggleVolume);
});
